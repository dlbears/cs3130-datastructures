import { JMatch, IFragment, IParsable } from './test3'


const testObject = `{
    "id": "1111",
    "name": "12345678901234567890",
    "balance": 234.5
  }`

const fragmentedObjs = [
    `{ "id": "1234", "name": "11111111112222222222", "balance": 111.4`,
    `}, { "id": "1235", "name": "12121212123232323232", "balance": 123.4 }, {`,
    `"id": "1236", "name": "22222222222222222222", "balance": 222.5 },`,
    `{ "id": "1237", "name": "33333333333333333333", "balance": 333.6 },`,
]

const testData = [
    testObject,
    ...fragmentedObjs
  ]

  const res: (IFragment | IParsable)[] = testData.map(value => JMatch(value))
  const defraggedRes = res.reduce(defragStream, initState) 