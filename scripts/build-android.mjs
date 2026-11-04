
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();

const tempRoot = resolve(root, ".android-build-temp");
const tempApp = resolve(tempRoot, "app");
const tempOutput = resolve(tempRoot, "out");
const finalOutput = resolve(root, "out");

function runBuild() {
  return new Promise((resolvePromise, reject) => {
    const nextBin = resolve(root, "node_modules/next/dist/bin/next");

    const child = spawn(process.execPath, [nextBin, "build"], {
      cwd: tempRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        TWINMART_BUILD_TARGET: "android",
        NEXT_PUBLIC_API_BASE_URL: "https://twinmart-app.vercel.app",
      },
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`Android build failed with exit code ${code}`));
      }
    });
  });
}

try {
  if (existsSync(tempRoot)) {
    throw new Error(
      "Temporary build folder already exists. Inspect it before continuing."
    );
  }

  mkdirSync(tempRoot, { recursive: true });

  // Copy the application source into a temporary folder.
  cpSync(resolve(root, "app"), tempApp, { recursive: true });

  // Remove payment API routes from the temporary copy only.
  rmSync(resolve(tempApp, "api"), {
    recursive: true,
    force: true,
  });

  // Copy the remaining application folders.
  for (const folder of ["lib", "types", "public"]) {
    const source = resolve(root, folder);

    if (existsSync(source)) {
      cpSync(source, resolve(tempRoot, folder), {
        recursive: true,
      });
    }
  }

  // Copy the Next.js configuration and required project files.
  for (const file of [
    "next.config.ts",
    "tsconfig.json",
    "package.json",
    "postcss.config.mjs",
    "next-env.d.ts",
    ".env.local",
  ]) {
    const source = resolve(root, file);

    if (existsSync(source)) {
      cpSync(source, resolve(tempRoot, file));
    }
  }

  // Make sure the temporary project uses the original dependencies.
  const tempPackage = JSON.parse(
    readFileSync(resolve(tempRoot, "package.json"), "utf8")
  );

  writeFileSync(
    resolve(tempRoot, "package.json"),
    JSON.stringify(tempPackage, null, 2)
  );

  console.log("Starting Android static export...");

  await runBuild();

  if (!existsSync(tempOutput)) {
    throw new Error("Android build finished, but the out folder was not generated.");
  }

  // Replace the old static export only after the new build succeeds.
  rmSync(finalOutput, { recursive: true, force: true });

  cpSync(tempOutput, finalOutput, {
    recursive: true,
  });

  console.log("Android frontend export completed successfully.");
} catch (error) {
  console.error("Android build failed:", error);
  process.exitCode = 1;
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
  console.log("Temporary build folder cleaned up.");
}
