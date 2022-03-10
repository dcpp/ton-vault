import {Address, Cell, CellMessage, CommonMessageInfo, ExternalMessage, InternalMessage} from 'ton'
import {readFile} from 'fs/promises'
import {SmartContract} from 'ton-contract-executor'
import BN from "bn.js"

const myAddress = Address.parse('EQA6rQndFwGsKh3p5YXHsHJqYSW4zudZioqFFNu6ia0r-6vH')
const contractAddress = Address.parse('EQC22GK60Mn5W6kY4XTQIJIjL3vfvkObR-iKxSwNmKC1gYoC')

let gContract: SmartContract

const getContract = async (source: string) => {
    if (gContract) {
        return gContract;
    }
    let data = new Cell()
    data.bits.writeUint(0, 1)        
    data.bits.writeUint(0, 1)        
    gContract = await SmartContract.fromFuncSource(source, data, { getMethodsMutate: true })
    return gContract
}

describe('TON Vault', () => {
    let source: string

    beforeAll(async () => {
        source = (await readFile('./contracts/msg_hex_comment.fc')).toString('utf-8')
        source += (await readFile('./contracts/vault.fc')).toString('utf-8')
    })

    it('should return total balance', async () => {
        let contract = await getContract(source)
        let res = await contract.invokeGetMethod('balance', []);
        expect(res.result[0]).toBeInstanceOf(BN)
        expect(res.result[0].toNumber()).toEqual(1000)
    })

    it('should return balance of user', async () => {
        let contract = await getContract(source)
        let address = new BN(myAddress.hash)
        let res = await contract.invokeGetMethod('balanceof',
            [{ type: 'int', value: myAddress.workChain.toString(10) }, { type: 'int', value: address.toString(10) }])

        expect(res.result[0]).toBeInstanceOf(BN)
        expect(res.result[0].toNumber()).toEqual(0)
    })

    it('should deposit by user and check user balance', async () => {
        let contract = await getContract(source)

        let messageBody = new Cell()
        messageBody.bits.writeUint(0, 32) // lead zeros
        messageBody.bits.writeString("00000001") // op
        messageBody.bits.writeString("0000000000000000") // query_id

        let res = await contract.sendInternalMessage(new InternalMessage({
            to: contractAddress,
            from: myAddress,
            value: new BN(100000000),
            bounce: false,
            body: new CommonMessageInfo({ body: new CellMessage(messageBody) })
        }))
        expect(res.exit_code).toEqual(0)

        res = await contract.invokeGetMethod('balance', []);
        expect(res.result[0]).toBeInstanceOf(BN)
        expect(res.result[0].toNumber()).toEqual(1000)

        res = await contract.invokeGetMethod('balanceof',
            [{ type: 'int', value: myAddress.workChain.toString(10) },
             { type: 'int', value: (new BN(myAddress.hash)).toString(10) }])
        expect(res.result[0]).toBeInstanceOf(BN)
        expect(res.result[0].toNumber()).toEqual(78800000)
    })

    it('should withdraw by user and check user balance', async () => {
        let contract = await getContract(source)

        let messageBody = new Cell()
        messageBody.bits.writeUint(0, 32) // lead zeros
        messageBody.bits.writeString("00000002") // op
        messageBody.bits.writeString("0000000000000001") // query_id
        messageBody.bits.writeString("0000000001000000") // amount 16777216 grams

        let res = await contract.sendInternalMessage(new InternalMessage({
            to: contractAddress,
            from: myAddress,
            value: 0,
            bounce: false,
            body: new CommonMessageInfo({ body: new CellMessage(messageBody) })
        }))
        console.log(res);
        expect(res.exit_code).toEqual(0)
    })

    it('should send external message', async () => {
        let contract = await getContract(source)

        let res = await contract.sendExternalMessage(new ExternalMessage({
            to: contractAddress,
            from: myAddress,
            body: new CommonMessageInfo({ body: new CellMessage(new Cell()) })
        }))
    })
})
