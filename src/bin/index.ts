import { program } from 'commander';
import { addApp } from './add';
import { deleteApp } from './delete';
import { setChannel } from './set';
import { uploadVersion } from './upload';
import pack from '../../package.json'

program
  .version(pack.version)
  .command('add [appid]').alias('a')
  .action(addApp)
  .option('-n, --name <name>', 'app name')
  .option('-i, --icon <icon>', 'app icon path')
  .option('-a, --apikey <apikey>', 'apikey to link to your account');

program
  .command('upload [appid]').alias('u')
  .action(uploadVersion)
  .option('-a, --apikey <apikey>', 'apikey to link to your account')
  .option('-p, --path <path>', 'path of the file to upload')
  .option('-c, --channel <channel>', 'channel to link to')
  .option('-e, --external <url>', 'link to external url intead of upload to capgo cloud')
  .option('-v, --version <version>', 'version number of the file to upload');

program
  .command('set [appid]').alias('s')
  .action(setChannel)
  .option('-c, --channel <channel>', 'channel to link to')
  .option('-v, --version <version>', 'version number of the file to upload')
  .option('-s, --state <state>', 'set the state of the channel, public or private')
  .option('-a, --apikey <apikey>', 'apikey to link to your account');

program
  .description('Manage package and version in capgo Cloud')
  .command('delete [appid]').alias('a')
  .action(deleteApp)
  .option('-a, --apikey <apikey>', 'apikey to link to your account')
  .option('-v, --version <version>', 'version number of the app to delete');

program.parse(process.argv);