import {Address, Cell, CellMessage, CommonMessageInfo, InternalMessage} from 'ton'
import {readFile} from 'fs/promises'
import {SmartContract} from 'ton-contract-executor'
import BN from "bn.js"

const myAddress = Address.parse('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t')
const contractAddress = Address.parse('kQChmZFQneZ6AUXG-eBkqcw_8WI6HQTD4i0Z9OTpJIYDH03t')

let gContract: SmartContract

const getContract = async (source: string) => {
    if (gContract) {
        return gContract;
    }
    let data = new Cell()
    data.bits.writeUint(0, 1)        
    gContract = await SmartContract.fromFuncSource(source, data, { getMethodsMutate: true })
    return gContract
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
            to: myAddress,
            from: myAddress,
            value: new BN(100),
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
        expect(res.result[0].toNumber()).toEqual(100)
    })
})
