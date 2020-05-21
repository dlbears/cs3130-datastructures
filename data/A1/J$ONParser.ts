import { Transform, TransformOptions } from 'stream'

type Cache<T> = T | null

type CachedFragment = Cache<IFragment>
type Match = IParsable[]

//Interfaces and Type Guards
export interface IFragment {
    fragment: string
}
  
export interface IParsable {
    parse: string
}

export const isFragment = (x: any): x is IFragment => x?.fragment ?? false
export const isParsable = (x: any): x is IParsable => x?.parse ?? false

interface parserState {
    fragment: CachedFragment,
    parse: Match 
}


export type FuzyMatch = (IFragment | IParsable)[]
export type StringMatcher = (s: string) => FuzyMatch
export type StateFragReducer = (acc: parserState, cur: FuzyMatch) => parserState

class Parser extends Transform {
    private state: parserState = {
        fragment: null,
        parse: []
    }

    constructor(private mFn: StringMatcher, private rFn: StateFragReducer, opts?: TransformOptions) {
        super({
            ...opts,
            readableObjectMode: true, 
            writableObjectMode: false
        })
    }

    _transform(chunk: Buffer, encoding, done: Function) {
        const s: string = chunk.toString() ?? done() 
        const fmatch: FuzyMatch = this.mFn(s) //?
        const { fragment, parse } = this.rFn(this.state, fmatch) 
        if (parse.length > 0) { 
            for (const p of parse) this.push(JSON.parse(p.parse))
            this.state.parse = []
        }
        else this.state.fragment = fragment
        done()
    }

}


const OPEN = '{',
      CLOSED = '}'

export const JMatch = (cache: string): (IFragment | IParsable)[] => {
        
        const fO = cache.indexOf(OPEN),
              lO = cache.lastIndexOf(OPEN),
              fC = cache.indexOf(CLOSED),
              lC = cache.lastIndexOf(CLOSED)
        const midParse = cache.substring(fO, lC+1) 
        const midCheck = Boolean(~midParse.indexOf(OPEN) && ~midParse.indexOf(CLOSED))
      
      
        if (!~fO || !~fC) {
          return [ { fragment: cache } ]
        } else if (fC < fO) { 
          if (lO === fO) {
            return midCheck ? [
              {fragment: cache.substring(0, fC+1)},
              {parse: cache.substring(fO, lC+1)}
            ] : [
                {fragment: cache.substring(0, fC+1)},
                {fragment: cache.substring(fO)}
            ]
          } else if (lO > lC) {
            const res1 = [ 
              {fragment: cache.substring(0, fC+1)}, 
              {parse: cache.substring(fO, lC+1)}, 
              {fragment: cache.substring(lO)}
            ],
            res2 = [
              {fragment: cache.substring(0, fC+1)},  
              {fragment: cache.substring(lO)}
            ] 
        
            if (midCheck) return res1 
            else return res2 
          
          }
        } else if (fC > fO) {
          if (fO === lO && fC === lC) return [ 
            { parse: cache.substring(fO, fC+1) } 
          ]
          else if (fO === lO) return [ 
            { fragment: cache.substring(0, fO) }, 
            { parse: cache.substring(lO, lC+1) } 
          ] 
          else if (fC === lC) return [ 
            { parse: cache.substring(fO, lC+1) }, 
            { fragment: cache.substring(lO) } 
          ]
          else if (fO !== lO && fC !== lC) return [
            {parse: cache.substring(fO, fC+1)},
            {parse: cache.substring(lO, lC+1)}
          ]
          else return [ 
            {parse: cache.substring(fO, fC+1)}, 
            {fragment: cache.substring(fC+1)} 
          ] 
        }
        console.log("error")  
      }
 
const defragStream = (j: StringMatcher) => 
                     (acc: parserState, cur: FuzyMatch) => 
                     cur.reduce((state, FoP) => 
        {
        const newState = state
        if (isParsable(FoP)) {
            newState.parse.push(FoP)
            newState.fragment = null
        } else if (isFragment(FoP)) {
            const cacheIsWarm = isFragment(state.fragment)
            if (cacheIsWarm) {
                const cache = state.fragment
                const res = j(cache.fragment.concat(FoP.fragment))
                const pRes = res.filter(x => isParsable(x)) as Match
                if (pRes.length > 0) {
                    newState.parse.push(...pRes)
                    newState.fragment = null
                }
            } else {
                newState.fragment = FoP
            }
        }
        return newState
      }, acc)
  
export const J$ONParser = (opts?: TransformOptions)=> new Parser(JMatch, defragStream(JMatch), opts)