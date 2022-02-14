import {Address, Cell, CellMessage, CommonMessageInfo, InternalMessage} from 'ton'
import {readFile} from 'fs/promises'
import {SmartContract} from 'ton-contract-executor'
import BN from "bn.js"

const contractAddress = Address.parse('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t')
const myAddress = Address.parse('kQChmZFQneZ6AUXG-eBkqcw_8WI6HQTD4i0Z9OTpJIYDH03t')

const getContract = async (source: string) => {
    let data = new Cell()
    data.bits.writeUint(0, 1)        
    return await SmartContract.fromFuncSource(source, data, { getMethodsMutate: true })
}

describe('TON Vault', () => {
    let source: string

    beforeAll(async () => {
        source = (await readFile('./contracts/vault.fc')).toString('utf-8')
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
        messageBody.bits.writeUint(1, 32) // op
        messageBody.bits.writeUint(2, 64) // query_id

        let res = await contract.sendInternalMessage(new InternalMessage({
            to: contractAddress,
            from: myAddress,
            value: new BN(10),
            bounce: false,
            body: new CommonMessageInfo({ body: new CellMessage(messageBody) })
        }))

        res = await contract.invokeGetMethod('balance', []);
        expect(res.result[0]).toBeInstanceOf(BN)
        expect(res.result[0].toNumber()).toEqual(1000)

        res = await contract.invokeGetMethod('balanceof',
            [{ type: 'int', value: myAddress.workChain.toString(10) },
             { type: 'int', value: (new BN(myAddress.hash)).toString(10) }])
        expect(res.result[0]).toBeInstanceOf(BN)
        expect(res.result[0].toNumber()).toEqual(0)
    })
})
