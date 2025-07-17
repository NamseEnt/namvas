import { spawn } from "bun";
import { join } from "path";
import { existsSync, readFileSync } from "fs";

interface Container {
  id: string;
  process: any; // Bun subprocess type
  state: "idle" | "busy" | "unhealthy";
  lastUsed: number;
  requestCount: number;
  currentRequest?: {
    resolve: (response: any) => void;
    reject: (error: Error) => void;
  };
}

interface PoolConfig {
  minSize: number;
  maxSize: number;
  healthCheckInterval: number;
  containerIdleTimeout: number;
}

export class ContainerPool {
  private containers: Map<string, Container> = new Map();
  private waitingQueue: Array<{
    request: any;
    resolve: (response: any) => void;
    reject: (error: Error) => void;
  }> = [];
  private config: PoolConfig;
  private healthCheckTimer?: Timer;
  private isShuttingDown = false;

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = {
      minSize: 2,
      maxSize: 10,
      healthCheckInterval: 30000,
      containerIdleTimeout: 300000, // 5분 idle 후 종료
      ...config,
    };
  }

  async initialize(): Promise<void> {
    console.log(`Initializing container pool with min=${this.config.minSize} containers...`);
    
    // 최소 개수만큼 컨테이너 시작
    const promises = [];
    for (let i = 0; i < this.config.minSize; i++) {
      promises.push(this.createContainer());
    }

    await Promise.all(promises);

    // Health check 시작
    this.startHealthCheck();

    console.log(`Container pool initialized with ${this.containers.size} containers`);
  }

  private async createContainer(): Promise<Container> {
    const id = crypto.randomUUID();
    console.log(`Creating container ${id}...`);


    // Load .env file from BE directory
    const envPath = join(process.cwd(), "../be/.env");
    let envVars = {};
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, "utf-8");
      envVars = Object.fromEntries(
        envContent
          .split("\n")
          .filter((line) => line && !line.startsWith("#"))
          .map((line) => line.split("=").map((s) => s.trim()))
          .filter(([key, value]) => key && value)
      );
    }

    const AWS_ENDPOINT_URL = "http://host.docker.internal:4566";
    const PORT = process.env.PORT || 3003;

    const env = {
      ...process.env,
      ...envVars,
      CONTAINER_ID: id,
      PORT: PORT.toString(),
      LOCAL_DEV: "1",
      EMULATOR_ENDPOINT: `http://host.docker.internal:${PORT}`,
      AWS_ENDPOINT_URL,
      QUEUE_URL: `${AWS_ENDPOINT_URL}/000000000000/main-queue`,
      CODE_VERSION: process.env.CODE_VERSION || "unknown",
    };

    // Docker 컨테이너 시작
    const dockerArgs = [
      "run",
      "-d", // Detached mode
      "--name",
      `lambda-${id}`,
      "--add-host",
      "host.docker.internal:host-gateway",
      "-v",
      `${join(process.cwd(), "../be/dist")}:/var/task/dist:ro`,
      "-v",
      `${join(process.cwd(), "../be/.env")}:/var/task/.env:ro`,
    ];

    // 환경 변수 추가
    Object.entries(env).forEach(([key, value]) => {
      dockerArgs.push("-e", `${key}=${value}`);
    });

    // 이미지 이름과 실행할 파일
    dockerArgs.push("local-lambda", "dist/local-entry.js");

    const proc = spawn(["docker", ...dockerArgs], {
      stdout: "pipe",
      stderr: "pipe",
    });

    // detached 모드에서는 container ID가 stdout으로 출력됨
    const containerIdOutput = await new Response(proc.stdout).text();
    const dockerContainerId = containerIdOutput.trim();
    
    // spawn이 완료될 때까지 대기
    await proc.exited;

    if (proc.exitCode !== 0) {
      const errorOutput = await new Response(proc.stderr).text();
      console.error(`Docker error: ${errorOutput}`);
      throw new Error(`Failed to create container ${id}`);
    }
    
    if (!dockerContainerId) {
      throw new Error(`No container ID returned for ${id}`);
    }

    console.log(`Container ${id} created with Docker ID: ${dockerContainerId.substring(0, 12)}`);

    const container: Container = {
      id,
      process: proc,
      state: "idle",
      lastUsed: Date.now(),
      requestCount: 0,
    };

    this.containers.set(id, container);
    
    // 컨테이너 로그 스트리밍
    this.streamContainerLogs(id);

    // 컨테이너가 준비될 때까지 대기
    await this.waitForContainerReady(container);

    return container;
  }

  private async waitForContainerReady(
    container: Container,
    maxRetries = 30
  ): Promise<void> {
    // 컨테이너가 첫 요청을 시도할 때까지 잠시 대기
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(`Container ${container.id} is ready`);
  }

  async handleRequest(requestData: any): Promise<any> {
    // 가용한 컨테이너 찾기
    let container = this.findIdleContainer();

    if (!container && this.containers.size < this.config.maxSize) {
      // 새 컨테이너 생성
      container = await this.createContainer();
    }

    if (!container) {
      // 대기열에 추가
      return new Promise((resolve, reject) => {
        this.waitingQueue.push({ request: requestData, resolve, reject });

        // 타임아웃
        setTimeout(() => {
          const index = this.waitingQueue.findIndex(
            (item) => item.resolve === resolve
          );
          if (index !== -1) {
            this.waitingQueue.splice(index, 1);
            reject(new Error("Container acquisition timeout"));
          }
        }, 30000);
      });
    }

    // 컨테이너 사용
    container.state = "busy";
    container.lastUsed = Date.now();
    container.requestCount++;

    return new Promise((resolve, reject) => {
      container.currentRequest = { resolve, reject };
    });
  }

  processResponse(containerId: string, response: any): void {
    const container = this.containers.get(containerId);
    if (!container || !container.currentRequest) {
      console.warn(`No pending request for container ${containerId}`);
      return;
    }

    // 응답 전달
    container.currentRequest.resolve(response);
    container.currentRequest = undefined;
    container.state = "idle";

    // 대기 중인 요청이 있으면 처리
    if (this.waitingQueue.length > 0) {
      const next = this.waitingQueue.shift()!;
      container.state = "busy";
      container.lastUsed = Date.now();
      container.requestCount++;
      container.currentRequest = { resolve: next.resolve, reject: next.reject };

      // 컨테이너가 다음 요청을 가져가도록 함
      // (컨테이너는 이미 다음 요청을 기다리고 있음)
    }
  }

  hasRequestForContainer(containerId: string): any | null {
    const container = this.containers.get(containerId);
    if (!container || container.state !== "busy" || !container.currentRequest) {
      return null;
    }

    // 대기 중인 요청이 있으면 반환
    if (this.waitingQueue.length > 0) {
      return this.waitingQueue[0]!.request;
    }

    return null;
  }

  private findIdleContainer(): Container | null {
    for (const container of this.containers.values()) {
      if (container.state === "idle") {
        return container;
      }
    }
    return null;
  }

  private streamContainerLogs(containerId: string): void {
    const proc = spawn(["docker", "logs", "-f", `lambda-${containerId}`], {
      stdout: "pipe",
      stderr: "pipe",
      onExit: () => {
      },
    });
    
    // stdout 로그 출력
    (async () => {
      const reader = proc.stdout.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = new TextDecoder().decode(value);
          console.log(text.trim());
        }
      } catch (e) {}
    })();
    
    // stderr 로그 출력
    (async () => {
      const reader = proc.stderr.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = new TextDecoder().decode(value);
          console.log(text.trim());
        }
      } catch (e) {}
    })();
  }

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      for (const container of this.containers.values()) {
        if (
          container.state === "idle" &&
          Date.now() - container.lastUsed > this.config.containerIdleTimeout
        ) {
          // 오래 사용하지 않은 컨테이너 종료
          if (this.containers.size > this.config.minSize) {
            await this.removeContainer(container.id);
          }
        }
      }
    }, this.config.healthCheckInterval);
  }

  private async removeContainer(containerId: string): Promise<void> {
    const container = this.containers.get(containerId);
    if (!container) return;


    // Docker 컨테이너 중지 및 제거
    await spawn(["docker", "stop", `lambda-${containerId}`]).exited;
    await spawn(["docker", "rm", `lambda-${containerId}`]).exited;

    this.containers.delete(containerId);
  }

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    // Health check 중지
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // 대기 중인 요청 모두 거부
    for (const entry of this.waitingQueue) {
      entry.reject(new Error("Container pool is shutting down"));
    }
    this.waitingQueue = [];

    // 모든 컨테이너 중지
    const promises = [];
    for (const containerId of this.containers.keys()) {
      promises.push(this.removeContainer(containerId));
    }

    await Promise.all(promises);

  }

  getMetrics() {
    const containers = Array.from(this.containers.values());
    const idle = containers.filter((c) => c.state === "idle").length;
    const busy = containers.filter((c) => c.state === "busy").length;
    const unhealthy = containers.filter((c) => c.state === "unhealthy").length;

    return {
      total: containers.length,
      idle,
      busy,
      unhealthy,
      queueLength: this.waitingQueue.length,
      utilizationRate: containers.length > 0 ? busy / containers.length : 0,
    };
  }

  async invalidateAll(): Promise<void> {
    console.log("Invalidating all containers due to code change...");
    
    // Mark all containers as unhealthy to prevent new requests
    for (const container of this.containers.values()) {
      container.state = "unhealthy";
    }
    
    // Create new containers to replace the old ones
    const promises = [];
    const targetSize = Math.min(this.config.minSize, this.containers.size);
    for (let i = 0; i < targetSize; i++) {
      promises.push(this.createContainer());
    }
    
    await Promise.all(promises);
    
    // Remove old containers
    const oldContainerIds = Array.from(this.containers.keys()).filter(
      id => this.containers.get(id)?.state === "unhealthy"
    );
    
    for (const id of oldContainerIds) {
      await this.removeContainer(id);
    }
    
    console.log(`Replaced ${oldContainerIds.length} containers with new ones`);
  }

  // Container별 대기 중인 long polling 요청
  private waitingContainers: Map<string, {
    resolve: (value: Response) => void;
    timer: Timer;
  }> = new Map();

  // 현재 처리 중인 요청들
  private activeRequests: Map<string, any> = new Map();

  getRequestForContainer(containerId: string): any | null {
    const container = this.containers.get(containerId);
    if (!container || container.state !== "idle") {
      return null;
    }

    // 대기 중인 요청이 있으면 할당
    if (this.waitingQueue.length > 0) {
      const { request } = this.waitingQueue.shift()!;
      container.state = "busy";
      container.lastUsed = Date.now();
      container.requestCount++;
      this.activeRequests.set(containerId, request);
      return request;
    }

    return null;
  }

  async waitForRequest(containerId: string): Promise<Response> {
    const container = this.containers.get(containerId);
    if (!container) {
      return new Response("Container not found", { status: 404 });
    }

    return new Promise<Response>((resolve) => {
      // 이전 대기 요청이 있으면 취소
      const existing = this.waitingContainers.get(containerId);
      if (existing) {
        clearTimeout(existing.timer);
        existing.resolve(new Response("Cancelled", { status: 499 }));
      }
      
      // 30초 타임아웃으로 대기
      const timer = setTimeout(() => {
        this.waitingContainers.delete(containerId);
        resolve(new Response("No pending request", { status: 404 }));
      }, 30000);
      
      this.waitingContainers.set(containerId, { resolve, timer });
    });
  }

  async handleRequest(requestData: any): Promise<Response> {
    // 가용한 컨테이너 찾기
    let container = this.findIdleContainer();

    if (!container && this.containers.size < this.config.maxSize) {
      // 새 컨테이너 생성
      container = await this.createContainer();
    }

    if (!container) {
      // 대기열에 추가하고 Promise 반환
      return new Promise((resolve, reject) => {
        this.waitingQueue.push({ 
          request: requestData, 
          resolve: (response: any) => {
            // Response 객체 생성
            const httpResponse = new Response(response.body, {
              status: response.status,
              headers: response.headers,
            });
            resolve(httpResponse);
          }, 
          reject 
        });

        // 타임아웃
        setTimeout(() => {
          const index = this.waitingQueue.findIndex(
            (item) => item.request === requestData
          );
          if (index !== -1) {
            this.waitingQueue.splice(index, 1);
            reject(new Error("Request timeout"));
          }
        }, 30000);
      });
    }

    // 컨테이너 사용
    container.state = "busy";
    container.lastUsed = Date.now();
    container.requestCount++;
    this.activeRequests.set(container.id, requestData);

    // 대기 중인 컨테이너에게 요청 전달
    const waiting = this.waitingContainers.get(container.id);
    if (waiting) {
      this.waitingContainers.delete(container.id);
      clearTimeout(waiting.timer);
      waiting.resolve(Response.json(requestData));
    }

    // 응답 대기
    return new Promise((resolve, reject) => {
      container.currentRequest = { 
        resolve: (response: any) => {
          // Response 객체 생성
          const httpResponse = new Response(response.body, {
            status: response.status,
            headers: response.headers,
          });
          resolve(httpResponse);
        }, 
        reject 
      };
    });
  }

  handleResponse(containerId: string, responseData: any): void {
    const container = this.containers.get(containerId);
    if (!container || !container.currentRequest) {
      console.warn(`No pending request for container ${containerId}`);
      return;
    }

    // 응답 전달
    container.currentRequest.resolve(responseData);
    container.currentRequest = undefined;
    container.state = "idle";
    this.activeRequests.delete(containerId);

    // 대기 중인 요청이 있으면 처리
    if (this.waitingQueue.length > 0) {
      const next = this.waitingQueue.shift()!;
      container.state = "busy";
      container.lastUsed = Date.now();
      container.requestCount++;
      container.currentRequest = { resolve: next.resolve, reject: next.reject };
      this.activeRequests.set(containerId, next.request);

      // 컨테이너가 이미 대기 중이면 즉시 요청 전달
      const waiting = this.waitingContainers.get(containerId);
      if (waiting) {
        this.waitingContainers.delete(containerId);
        clearTimeout(waiting.timer);
        waiting.resolve(Response.json(next.request));
      }
    }
  }
}
