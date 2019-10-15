import * as fs from 'fs'
import * as path from 'path'

const output = path.resolve(__dirname, 'out')

const master = path.resolve(__dirname, 'master.json')

const filein = fs.createReadStream(master)
const out = fs.createWriteStream(output)

const Test = async () => {
 //const filein = fs.createReadStream(master)
 //const out = fs.createWriteStream(output)
 for await(const chk of filein) {
    out.write(chk)
 }
 return new Promise((res, rej) => {
    filein.on('close', res)
    filein.on('error', rej)
 })
}
Test().then(console.log).catch(console.error)
