import sm from 'source-map-support'
import assert from 'assert'
import {describe, it} from 'mocha'
import {Env, varCmd} from '../js/index.js'

sm.install()

export class Person {
  constructor(
    public name: string,
    public height: number,
    public pets = [] as Pet[],
  ) {}
}

class Pet {
  constructor(
    public name: string
  ) {}
}

class Dog extends Pet {
}

const model1 = new Person('fred', 13, [new Dog('chauncey')])
const cmds1: varCmd[] = [
  {type: 'def', parent: 0, id: 1, meta: {path: ['name']}},
  {type: 'def', parent: 0, id: 2, meta: {path: ['height']}},
]

debugger

describe('Env', function () {
  describe('Variables', function() {
    it("should register variables", function() {
      const env = new Env(model1)
      env.run(...cmds1)

      assert(Object.keys(env.variables).length = 3)
      assert.deepEqual(env.variables[0].metadata.path, [])
      assert.deepEqual(env.variables[1].metadata.path, ['name'])
      assert.deepEqual(env.variables[2].metadata.path, ['height'])
    })
    it("should create commands", function() {
      const env = new Env(model1)
      env.run(...cmds1)
      const changes = env.refresh()

      console.log('changes', changes)
    })
  })
})
