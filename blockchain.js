const crypto = require('crypto')
const Buffer = require('buffer')
const http = require('http')
const fs = require('fs')
const path = require('path')

const rootdir = __dirname
const proteinList = [
  '3q1q', '1qys', '1m2z', '4hhb', '7k8t', '7k43', '5a39', '6wlb',
  '6x9q', '1cu1', '6r3q', '5is0', '6yyt', '4z64', '1pkq', '6crz',
  '3jb9', '6j8j', '6lu7', '6j4y', '1lm8', '1bp2', '1mrr', '4v6m',
  '1bi7', '4pe5', '1ycr', '2ifq', '4uww', '2zb5', '1ap8', '4kzd'
]

let blockchainStore = {}

class ProteinOutput {
  constructor(x, y, z, rx, ry, rz) {
    this.x = x
    this.y = y
    this.z = z
    this.rx = rx
    this.ry = ry
    this.rz = rz
  }
}

function loadProteins() {
  fs.mkdir(path.resolve(rootdir, 'prots'))
  for(let p of proteinList) {
    http.get(`http://files.rcsb.org/download/${p}.pdb`, (res) => {
      if(res.statusCode !== 200) {
        console.warn(`Protein ${p} not loaded`)
      } else {
        let ws = fs.createWriteStream(path.resolve(rootdir, 'prots', `${p}.pdb`))
        res.pipe(ws)
        ws.on('close', () => {

        })
      }
    })
  }
}


function AutodockVina() {

}

function AutodockVinaLite() {

}

class Block {
  constructor(previousHash, protOut, ownerPkey, blockHash, sign) {
    this.id = Math.floor(Math.random() * 0xffffffff)
    this.timestamp = Date.now()
    this.protOut = protOut
    this.ownerPkey = ownerPkey
    this.previousHash = previousHash
    this.blockHash = blockHash
    this.sign = sign
  }

  constructor(b) {
    this.id = b.readUInt32LE(this.id, 0)
    this.timestamp = b.readBigUInt64LE(this.timestamp, 4)
    this.protOut = new ProteinOutput(
      b.readFloatLE(this.protOut.x, 12),
      b.readFloatLE(this.protOut.y, 16),
      b.readFloatLE(this.protOut.z, 20),
      b.readFloatLE(this.protOut.rx, 24),
      b.readFloatLE(this.protOut.ry, 28),
      b.readFloatLE(this.protOut.rz, 32)
    )
    this.ownerPkey = b.slice(36, 586)
    this.previousHash = b.readUInt32LE(this.id, 0)
    this.blockHash = blockHash
    this.sign = sign
  }

  getBlock() {
    let b = Buffer.alloc(598)
    b.writeUInt32LE(this.id, 0)
    b.writeBigUInt64LE(this.timestamp, 4)
    b.writeFloatLE(this.protOut.x, 12)
    b.writeFloatLE(this.protOut.y, 16)
    b.writeFloatLE(this.protOut.z, 20)
    b.writeFloatLE(this.protOut.rx, 24)
    b.writeFloatLE(this.protOut.ry, 28)
    b.writeFloatLE(this.protOut.rz, 32)
    b.write(this.ownerPkey.toString('base64'), 36, 550, 'base64')
    b.writeUInt32LE(this.blockHash, 586)
    b.writeBigUInt64LE(this.sign, 590)
    return b
  }

  getSignable() {
    let b = Buffer.alloc(554)
    b.writeUInt32LE(this.previousHash, 0)
    b.write(this.ownerPkey.toString('base64'), 4, 550, 'base64')
    return b
  }

  getSignableHash() {
    return crypto.createHash('sha256').update(getSignable()).digest().readUInt32LE()
  }

  getHash() {
    return crypto.createHash('sha256').update(getBlock()).digest().readUInt32LE()
  }

  transfer(newOwnerPkey, myPrivateKey) {
    let hash = getSignableHash()
    let protein = hash.readUInt8() & 31 // Choose random protein in the 32 item list
    let molecule = hash.readUInt32LE() >> 5 // Choose random molecule, 2^251 options
    let protOut = AutodockVina.run(protein, molecule)
    let sign = crypto.createSign('SHA256').update(hash).end().sign(myPrivateKey).readBigUInt64LE()
    return new Block(hash, protOut, newOwnerPkey, hash, sign)
  }

  getPrevBlock() {
    let bc = blockchainStore[id]
    if(bc !== undefined) {
      return bc[bc.length - 1]
    } else {
      return false
    }
  }

  verify() {
    if(!crypto.createVerify('SHA256').update(this.signedKey).end().verify(
      "-----BEGIN PUBLIC KEY-----\n" +
      this.publicKey.toString('base64') +
      "\n-----END PUBLIC KEY-----", this.verif)) {
      return false
    }

    let diff = Date.now - this.timestamp
    if(diff > 600 || diff < 0) {
      return false
    }

    let prot = this.previousHash.readUInt8() & 31
    let mole = this.previousHash.readUInt32LE() >> 5
    let energy = AutodockVinaLite.run(prot, mole, protOut)
    if(energy > 100) {
      return false
    }
    return true
  }
}

/*
class BlockChain {
    constructor(genesis) {
        this.chain = [this.createFirstBlock(genesis)]
    }
    createFirstBlock(genesis) {
        return new Block(0,genesis)
    }
    getLastBlock() {
        return this.chain[this.chain.length-1]
    }
    addBlock(data){
        let prevBlock = this.getLastBlock()
        let block = new Block(prevBlock+1, data, prevBlock.hash)
    }
}
*/

module.exports = Block

(function runTests() {
  let previousHash = 0
  let ownerPkey = 0
  let previousHash = 0
  let signedKey = 0
  let protOut = new ProteinOutput(0, 0, 0, 0, 0, 0)


  let block1 = new Block(previousHash, protOut, ownerPkey, blockHash, signedKey)


  let newOwnerPkey = 1
  let myPrivateKey = 10
  block1.transfer(newOwnerPkey, myPrivateKey)
  //let kp = crypto.generateKeyPairSync('rsa', {modulusLength: 4096, publicKeyEncoding: {type: 'spki', format: 'der'}, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }})
})()
