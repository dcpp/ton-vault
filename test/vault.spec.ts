
import {Address, Cell} from 'ton';
import {readFile} from 'fs/promises';
//import BN from "bn.js";
import {SmartContract} from 'ton-contract-executor';

const myAddress = Address.parseFriendly('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t').address

describe('TON Vault', () => {
    let source: string;

    beforeAll(async () => {
        source = (await readFile('./contracts/vault.fc')).toString('utf-8');
    });

    it('should return total balance', async () => {
        let dataCell = new Cell()
        dataCell.bits.writeUint(0, 1)        
        let contract = await SmartContract.fromFuncSource(source, dataCell, { getMethodsMutate: true });
        console.log(contract);
        let res = await contract.invokeGetMethod('balance', []);
        //let address = new BN(myAddress.hash)
        //let res = await contract.invokeGetMethod('balanceof', [{ type: 'int', value: address.toString(10) }]);
        //expect(res.result[0]).toBeInstanceOf(Cell)
    });
});

