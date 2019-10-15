import { a1 } from './A1/a1'

const runner = async () => {
    let call = a1();
    try {
        let result = await call
        console.log(result)
    } catch (e) {
        console.error(e)
    }
    return call
}

runner().then(x => console.log(x)).catch(e => console.error(e))
//a1Test()