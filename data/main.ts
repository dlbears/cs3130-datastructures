import { Assignment1 } from './A1/Assignment1'

const runner = async () => {
    let call = new Assignment1();
    try {
        let result = await call.run()
        console.log(result)
    } catch (e) {
        console.error(e)
    }
    return call
}

runner().then(x => console.log(x)).catch(e => console.error(e))
//a1Test()