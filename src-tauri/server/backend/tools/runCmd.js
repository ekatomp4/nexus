const { spawn } = require('child_process');

async function runCmd(args) {
    return new Promise((resolve, reject) => {
      // join commands with & so they run sequentially
      const cmdStr = args.join(' & ');
  
      // spawn cmd.exe with /c to run commands and close
      console.log(`running command: ${cmdStr}`);
      const cmd = spawn('cmd.exe', ['/c', cmdStr], { shell: true });
  
      let output = '';
      let error = '';
  
      cmd.stdout.on('data', (chunk) => {
        process.stdout.write(chunk); // optional: live stream to console
        output += chunk.toString();
      });
  
      cmd.stderr.on('data', (chunk) => {
        process.stderr.write(chunk); // stream errors
        error += chunk.toString();
      });
  
      cmd.on('close', (code) => {
        if (code === 0) resolve(output.trim());
        else reject(new Error(`Command exited with code ${code}: ${error.trim()}`));
      });
  
      cmd.on('error', (err) => reject(err));
    });
}

module.exports = runCmd;