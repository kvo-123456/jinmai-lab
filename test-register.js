const { exec } = require('child_process');
exec('vercel logs', { cwd: 'c:/Users/Chen sheng hui/Desktop/jinmai.lab/307970170114' }, (error, stdout, stderr) => {
  console.log('STDOUT:', stdout);
  console.log('STDERR:', stderr);
  console.log('ERROR:', error);
});