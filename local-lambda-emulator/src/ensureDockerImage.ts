import { spawn } from "bun";
import { join } from "path/posix";

export async function ensureDockerImage(): Promise<void> {
  // Check if image exists
  const checkProc = spawn(["docker", "images", "-q", "local-lambda"], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const output = await new Response(checkProc.stdout).text();

  if (output.trim()) {
    return;
  }

  // Build the image
  const buildProc = spawn(
    ["docker", "build", "-f", "Dockerfile.lambda", "-t", "local-lambda", "."],
    {
      cwd: join(__dirname, ".."),
      stdout: "pipe",
      stderr: "pipe",
    }
  );

  // Stream build output
  const stdoutReader = buildProc.stdout.getReader();
  const stderrReader = buildProc.stderr.getReader();

  (async () => {
    try {
      while (true) {
        const { done, value } = await stdoutReader.read();
        if (done) break;
        process.stdout.write(new TextDecoder().decode(value));
      }
    } catch (e) {}
  })();

  (async () => {
    try {
      while (true) {
        const { done, value } = await stderrReader.read();
        if (done) break;
        process.stderr.write(new TextDecoder().decode(value));
      }
    } catch (e) {}
  })();

  await buildProc.exited;

  if (buildProc.exitCode !== 0) {
    throw new Error("Failed to build Docker image");
  }
}
