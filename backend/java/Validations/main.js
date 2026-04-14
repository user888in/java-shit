const path = require('path')

console.log(__dirname)
const filePath = path.join(__dirname, "folder","subfolder","file.txt")
console.log(filePath);

console.log(path.resolve('file.txt'));

const parsed = path.parse("d:\Java\java\Validations\folder\subfolder\file.txt");
console.log(parsed);

console.log(path.format(parsed))
