const crypto = require('crypto')
const Buffer = require('buffer')
const http = require('http')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

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
  try {
    fs.mkdirSync(path.resolve(rootdir, 'pdb'))
    fs.mkdirSync(path.resolve(rootdir, 'pdbqt'))
    for(let p of proteinList) {
      http.get(`http://files.rcsb.org/download/${p}.pdb`, (res) => {
        if(res.statusCode !== 200) {
          console.warn(`Protein ${p} not loaded`)
        } else {
          let ws = fs.createWriteStream(path.resolve(rootdir, 'pdb', `${p}.pdb`))
          res.pipe(ws)
          ws.on('close', () => {
            spawn('python2', [
              path.resolve(rootdir, '..',
                'mgltools_1.5.7/MGLToolsPckgs/AutoDockTools/Utilities24/prepare_receptor4.py'),
              '-r', path.resolve(rootdir, 'pdb', `${p}.pdb`),
              '-o', path.resolve(rootdir, 'pdbqt', `${p}.pdbqt`)])
          })
        }
      })
    }
  } catch(e) {
    return
  }
}

loadProteins()

function AutodockVina(protein, molecule) {
  return new ProteinOutput(1.1,1.2,1.3,0.1,0.2,0.3) // TODO: IMPLEMENT
}

function AutodockVinaLite(protein, molecule, protOut) {
  return 0.1 // TODO: IMPLEMENT
}

class Block {
  constructor(...args) {
    if(args.length === 5) {
      [previousHash, protOut, ownerPkey, blockHash, sign] = args
      this.id = Math.floor(Math.random() * 0xffffffff)
      this.timestamp = Date.now()
      this.protOut = protOut
      this.ownerPkey = ownerPkey
      this.previousHash = previousHash
      this.blockHash = blockHash
      this.sign = sign
    } else if(args.length === 1) {
      let b = args[0]
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
      this.blockHash = blockHash
      this.sign = sign
    }
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
    b.writeUInt32LE(this.previousHash || getPrevBlock().getHash(), 0)
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
    let prev = getPrevBlock()
    if(!crypto.createVerify('SHA256').update(prev.signedKey).end().verify(
      "-----BEGIN PUBLIC KEY-----\n" +
      prev.publicKey.toString('base64') +
      "\n-----END PUBLIC KEY-----", prev.getSignableHash())) {
      return false
    }

    let diff = Date.now - this.timestamp
    if(diff > 600 || diff < 0) {
      return false
    }

    let protein = this.previousHash.readUInt8() & 31
    let molecule = this.previousHash.readUInt32LE() >> 5
    let energy = AutodockVinaLite.run(protein, molecule, protOut)
    if(energy > 1) {
      return false
    }
    return true
  }
}
/*
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
})()*/
