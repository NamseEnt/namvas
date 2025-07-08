import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as net from 'net';

const sleep = promisify(setTimeout);

class E2ETestRunner {
  private dockerProcess: ChildProcess | null = null;
  private isCleaningUp = false;
  private lambdaFunctionUrl: string | null = null;
  private localstackPort: string = '4566';

  async run(): Promise<void> {
    console.log('🚀 E2E 테스트 시작');
    
    // 신호 핸들러 등록
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
    process.on('exit', () => this.cleanup());

    try {
      // 1. 사용 가능한 포트 찾기
      this.localstackPort = await this.findAvailablePort(4566);
      console.log(`🔍 LocalStack 포트: ${this.localstackPort}`);
      
      // 2. Docker Compose 시작
      await this.startDockerServices();
      
      // 3. 서비스 준비 상태 확인
      await this.waitForServices();
      
      // 4. Playwright 테스트 실행
      const testResult = await this.runPlaywrightTests();
      
      console.log(testResult ? '✅ 모든 테스트 통과' : '❌ 테스트 실패');
      process.exit(testResult ? 0 : 1);
      
    } catch (error) {
      console.error('❌ 테스트 실행 중 오류:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  private async findAvailablePort(startPort: number): Promise<string> {
    for (let port = startPort; port < startPort + 100; port++) {
      if (await this.isPortAvailable(port)) {
        return port.toString();
      }
    }
    throw new Error('사용 가능한 포트를 찾을 수 없습니다');
  }

  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
      server.on('error', () => resolve(false));
    });
  }

  private async startDockerServices(): Promise<void> {
    console.log('🐳 Docker 서비스 시작 중...');
    
    return new Promise((resolve, reject) => {
      this.dockerProcess = spawn('docker-compose', [
        '-f', 'docker-compose.e2e.yml',
        'up', '--build', '--remove-orphans'
      ], {
        stdio: 'pipe',
        cwd: process.cwd(),
        env: {
          ...process.env,
          LOCALSTACK_PORT: this.localstackPort
        }
      });

      this.dockerProcess.stdout?.on('data', (data) => {
        process.stdout.write(data);
      });

      this.dockerProcess.stderr?.on('data', (data) => {
        process.stderr.write(data);
      });

      this.dockerProcess.on('error', reject);
      
      // Docker Compose가 시작되면 resolve
      setTimeout(() => resolve(), 5000);
    });
  }

  private async waitForServices(): Promise<void> {
    console.log('⏳ 서비스 준비 상태 확인 중...');
    
    // Wait for LocalStack
    console.log('🔍 LocalStack 서비스 확인 중...');
    await this.waitForUrl(`http://localhost:${this.localstackPort}/_localstack/health`, 'LocalStack');
    
    // Wait for Lambda emulator
    console.log('🔍 Lambda emulator 확인 중...');
    await this.waitForLambdaEmulator();
    
    // Wait for Frontend deployment to complete
    console.log('🔍 Frontend 배포 완료 대기 중...');
    await this.waitForFrontendDeployment();
  }

  private async waitForFrontendDeployment(): Promise<void> {
    // Wait for frontend deployment container to complete
    console.log('⏳ Frontend 빌드 및 배포 대기 중...');
    
    for (let i = 0; i < 180; i++) { // 6분까지 기다림
      try {
        const { execSync } = require('child_process');
        const result = execSync('docker ps --filter "name=frontend-deploy-e2e" --format "{{.Status}}"', { encoding: 'utf8' }).trim();
        
        if (!result) {
          // 컨테이너가 종료됨 - 배포 완료
          console.log('✅ Frontend 배포 컨테이너 완료');
          break;
        }
        
        if (i % 5 === 0) {
          console.log(`⏳ Frontend 배포 중... (${i + 1}/120) - ${result}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        // docker 명령 실패 시에도 컨테이너가 없다고 가정
        console.log('✅ Frontend 배포 컨테이너 완료 (docker 명령 실패)');
        break;
      }
    }
    
    // S3 버킷 존재 확인 먼저
    console.log('🔍 S3 버킷 확인 중...');
    for (let i = 0; i < 10; i++) {
      try {
        const response = await fetch(`http://localhost:${this.localstackPort}/frontend-bucket`, {
          method: 'HEAD'
        });
        if (response.ok) {
          console.log('✅ S3 버킷 확인됨');
          break;
        }
      } catch (error) {
        console.log(`⏳ S3 버킷 대기 중... (${i + 1}/10)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Check if S3 website is accessible
    const frontendUrl = `http://frontend-bucket.s3-website.localhost.localstack.cloud:${this.localstackPort}`;
    console.log('🔍 Frontend S3 웹사이트 확인 중...');
    await this.waitForUrl(frontendUrl, 'Frontend');
  }

  private async waitForLambdaEmulator(): Promise<void> {
    // Wait for lambda-emulator container to be ready
    for (let i = 0; i < 30; i++) {
      try {
        // Check if lambda emulator is responding
        const response = await fetch(`http://localhost:3003/__emulator/request`);
        
        if (response.status === 404 || response.ok) {
          // 404 is expected when no request is pending - means emulator is running
          console.log('✅ Lambda emulator 준비 완료');
          return;
        }
      } catch (error) {
        // Lambda emulator not ready yet
      }
      
      console.log(`⏳ Lambda emulator 대기 중... (${i + 1}/30)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Lambda emulator가 준비되지 않았습니다');
  }

  private async waitForUrl(url: string, serviceName: string, maxRetries = 60): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          console.log(`✅ ${serviceName} 준비 완료`);
          return;
        } else {
          console.log(`⏳ ${serviceName} 응답 상태: ${response.status} (${i + 1}/${maxRetries})`);
        }
      } catch (error) {
        console.log(`⏳ ${serviceName} 연결 실패: ${error instanceof Error ? error.message : String(error)} (${i + 1}/${maxRetries})`);
      }
      
      await sleep(3000);
    }
    
    throw new Error(`${serviceName} 서비스가 준비되지 않았습니다 (URL: ${url})`);
  }

  private async runPlaywrightTests(): Promise<boolean> {
    console.log('🎭 Playwright 테스트 실행 중...');
    
    return new Promise((resolve) => {
      const playwrightProcess = spawn('npx', ['playwright', 'test'], {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: {
          ...process.env,
          LOCALSTACK_PORT: this.localstackPort
        }
      });

      playwrightProcess.on('close', (code) => {
        resolve(code === 0);
      });

      playwrightProcess.on('error', (error) => {
        console.error('Playwright 실행 오류:', error);
        resolve(false);
      });
    });
  }

  private async cleanup(): Promise<void> {
    if (this.isCleaningUp) return;
    this.isCleaningUp = true;
    
    console.log('\n🧹 환경 정리 중...');
    
    return new Promise((resolve) => {
      const cleanupProcess = spawn('docker-compose', [
        '-f', 'docker-compose.e2e.yml',
        'down', '--volumes', '--remove-orphans'
      ], {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: {
          ...process.env,
          LOCALSTACK_PORT: this.localstackPort
        }
      });

      cleanupProcess.on('close', () => {
        console.log('✅ 환경 정리 완료');
        resolve();
      });

      cleanupProcess.on('error', (error) => {
        console.error('정리 중 오류:', error);
        resolve();
      });
    });
  }
}

// 스크립트 실행
const runner = new E2ETestRunner();
runner.run().catch((error) => {
  console.error('실행 오류:', error);
  process.exit(1);
});