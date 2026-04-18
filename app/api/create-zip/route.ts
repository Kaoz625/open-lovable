import { NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';

declare global {
  var activeSandbox: any;
  var activeSandboxProvider: any;
}

export async function POST() {
  try {
    // Support both v1 (activeSandbox) and v2 (activeSandboxProvider) sandbox patterns
    const provider = sandboxManager.getActiveProvider() || global.activeSandboxProvider;
    const legacySandbox = global.activeSandbox;

    if (!provider && !legacySandbox) {
      return NextResponse.json({
        success: false,
        error: 'No active sandbox'
      }, { status: 400 });
    }

    console.log('[create-zip] Creating project zip...');

    let base64Content: string;

    if (provider) {
      // Use the raw E2B sandbox's runCode to build the zip with Python's zipfile module.
      // This avoids the broken `runCommand` bash-splitting issue and stdout buffer limits
      // from piping large base64 output.
      const rawSandbox = (provider as any).sandbox;

      if (rawSandbox && typeof rawSandbox.runCode === 'function') {
        // Step 1: Create zip + write base64 to a temp file (avoids stdout buffer limits)
        const buildResult = await rawSandbox.runCode(`
import zipfile, base64, os, io

work_dir = '/home/user/app'
exclude_dirs = {'node_modules', '.git', '.next', 'dist', 'build', '__pycache__'}
exclude_exts = {'.log', '.DS_Store'}

buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(work_dir):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for fname in files:
            if not any(fname.endswith(ext) for ext in exclude_exts):
                fp = os.path.join(root, fname)
                arcname = os.path.relpath(fp, work_dir)
                try:
                    zf.write(fp, arcname)
                except Exception as e:
                    pass  # skip unreadable files

b64 = base64.b64encode(buf.getvalue()).decode('ascii')
with open('/tmp/project.b64', 'w') as f:
    f.write(b64)
print(f"ZIP created: {len(buf.getvalue())} bytes, b64 length: {len(b64)}")
`);

        if (buildResult.error) {
          throw new Error(`Python zip creation failed: ${buildResult.error.value || buildResult.error}`);
        }
        console.log('[create-zip]', buildResult.logs?.stdout?.join('') || 'zip built');

        // Step 2: Read the b64 file — prefer E2B files API (returns raw bytes/text without stdout limits)
        if (rawSandbox.files && typeof rawSandbox.files.read === 'function') {
          const fileData = await rawSandbox.files.read('/tmp/project.b64');
          base64Content = typeof fileData === 'string'
            ? fileData
            : Buffer.from(fileData as Uint8Array).toString('ascii');
        } else {
          // Fallback: read via Python runCode (stdout should be fine for text)
          const readResult = await rawSandbox.runCode(`
with open('/tmp/project.b64', 'r') as f:
    print(f.read(), end='')
`);
          base64Content = (readResult.logs?.stdout || []).join('');
        }
      } else {
        // Fallback for providers without raw sandbox (e.g. Vercel):
        // runCommand splits on spaces so only simple commands work; use Python via runCode if possible
        const workDir = '/home/user/app';
        const zipResult = await provider.runCommand('python3 -c "import zipfile,base64,os,io;buf=io.BytesIO();zf=zipfile.ZipFile(buf,\'w\',zipfile.ZIP_DEFLATED);[zf.write(os.path.join(r,f),os.path.relpath(os.path.join(r,f),\'/home/user/app\')) for r,ds,fs in os.walk(\'/home/user/app\') for d in [ds.__setitem__(slice(None),[x for x in ds if x not in {\'node_modules\',\'.git\',\'.next\',\'dist\',\'build\'}])] for f in fs];zf.close();open(\'/tmp/project.b64\',\'w\').write(base64.b64encode(buf.getvalue()).decode())"');
        if (!zipResult.success) {
          throw new Error(`Failed to create zip: ${zipResult.stderr || zipResult.stdout}`);
        }
        const readResult = await provider.runCommand('cat /tmp/project.b64');
        if (!readResult.success) {
          throw new Error(`Failed to read zip: ${readResult.stderr}`);
        }
        base64Content = (readResult.stdout || '').trim();
      }

    } else {
      // V1 legacy sandbox
      const zipResult = await legacySandbox.runCommand({
        cmd: 'bash',
        args: ['-c', `cd /home/user/app && python3 -c "import zipfile,base64,os,io; buf=io.BytesIO(); zf=zipfile.ZipFile(buf,'w',zipfile.ZIP_DEFLATED); [zf.write(os.path.join(r,f), os.path.relpath(os.path.join(r,f),'/home/user/app')) for r,ds,fs in os.walk('/home/user/app') for d in [ds.__setitem__(slice(None),[x for x in ds if x not in {'node_modules','.git','.next','dist','build'}])] for f in fs]; zf.close(); open('/tmp/project.b64','w').write(base64.b64encode(buf.getvalue()).decode())"`]
      });
      if (zipResult.exitCode !== 0) {
        throw new Error(`Failed to create zip: ${await zipResult.stderr()}`);
      }
      const readResult = await legacySandbox.runCommand({
        cmd: 'cat',
        args: ['/tmp/project.b64']
      });
      if (readResult.exitCode !== 0) {
        throw new Error(`Failed to read zip: ${await readResult.stderr()}`);
      }
      base64Content = (await readResult.stdout()).trim();
    }

    if (!base64Content) {
      throw new Error('Empty zip content returned from sandbox');
    }

    // Return as a binary file download
    const buffer = Buffer.from(base64Content, 'base64');
    console.log(`[create-zip] Returning binary zip (${buffer.length} bytes)`);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="project.zip"',
        'Content-Length': String(buffer.length),
      },
    });

  } catch (error) {
    console.error('[create-zip] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
