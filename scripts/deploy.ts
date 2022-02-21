import {Address, Cell, ContractSource, TonClient, contractAddress} from "ton";
import {compileFunc} from "ton-compiler";
import {readFile} from "fs/promises";

const stringToCell = (str: string) => {
    let cell = new Cell()
    cell.bits.writeString(str)
    return cell
}

const ownerAndCreator = Address.parseFriendly('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t').address

function buildDataCell() {
    let dataCell = new Cell()
    dataCell.bits.writeUint(0, 1)         // inited
    dataCell.bits.writeUint(0, 1)         // balances

    return dataCell
}

async function deploy() {
    let funcSource = (await readFile('./contracts/vault.fc')).toString('utf-8')
    let source = await compileFunc(funcSource)
    let sourceCell = Cell.fromBoc(source.cell)[0]
    let dataCell = buildDataCell()

    let contractSource: ContractSource = {
        initialCode: sourceCell,
        initialData: dataCell,
        workchain: 0,
        type: '',
        backup: () => '',
        describe: () => ''
    }

    let address = await contractAddress(contractSource)

    console.log('contract address', address)

    let client = new TonClient({
        endpoint: 'https://scalable-api.tonwhales.com/jsonRPC'
    })

    let msgCell = new Cell()
    msgCell.bits.writeUint(0, 1); // inited
    msgCell.bits.writeUint(0, 1); // dict

    await client.sendExternalMessage(
        {
            address,
            source: contractSource
        },
        msgCell
    )

    console.log('Init message was sent to', address)
}

deploy()