import React, {useState, useEffect} from "react"
import {control, Render} from 'react-mvc-lite'

const MCVeeContext = React.createContext(null)
const ViewContext = React.createContext(null as viewContext)

type path = (string | number)[]

type viewContext = {mcvee: MCVee, path: path}

type simpleMap<T> = {[key: string]: T}

/**
 * A replaceable "hole" in the page
 */
type ViewFactory = (model: any)=> Viewdef<any>

  type modelSetter = (model: any)=> any

class PropertyFetcher<PROPS> {
  constructor(
    public viewDef: Viewdef<PROPS>,
    public props = {},
  ) {}
  
  get(target, prop, receiver) {
    return (defaultValue: any, meta?: any) => {
      return this.fetch(prop, defaultValue, meta || prop)
    }
  }

  fetch(prop: string, defaultValue: any, meta: any) {
    if (prop in this.props) return this.props
    this.viewDef.missingProps[prop] = meta
    return defaultValue
  }
}

/**
 * A node in the page tree
 *
 * Each node gets a piece of React state
 */
export class Viewdef<PROPS> {
  props: PropertyFetcher<PROPS>
  // this proxy emulates this type as well
    & {[P in keyof PROPS]: (defaultValue: PROPS[P], meta?: any)=> PROPS[P]};

  constructor(
    public id: string,
    model: any,
    public modelSetter?: modelSetter,
    public missingProps = {},
    public children = {} as simpleMap<Viewdef<any>>,
    public used = {} as simpleMap<boolean>,
  ) {
    this.set(model, (v)=> {})
  }

  clearUsed() {
    this.used = {}
    Object.values(this.children).forEach(child=> child.clearUsed())
  }

  at(path: path) {
    return path.length ? this.children[path[0]].at(path.slice(1)) : this
  }

  use(id) {
    if (id in this.used) throw Error(`duplicate view id: ${id}`)
    this.used[id] = true
  }

  set(model: any, modelSetter: modelSetter) {
    this.props = new Proxy(Object.assign({}, model), new PropertyFetcher(this)) as any
    this.modelSetter = modelSetter
  }

  retainUsed() {
    const newChildren = {}

    for (const id of Object.keys(this.used)) {
      const child = this.children[id]

      newChildren[id] = child
      child && child.retainUsed()
    }
    this.children = newChildren
  }
}

/**
 * Manages the page
 */
export class MCVee {
  rootModel: any
  root: Viewdef<any>

  static modelClasses = {}

  static register(...modelClasses: ({new (...args)})[]) {
    for (const modelClass of modelClasses) {
      MCVee.modelClasses[modelClass.name] = modelClass
    }
  }

  static simpleViewFactory(id: string | number, model: any): Viewdef<any> {
    return new MCVee.modelClasses[model.type](id, model)
  }

  constructor(public model: any, public viewFactory = MCVee.simpleViewFactory) {
    this.rootModel = model
    this.root = viewFactory(null, model)
  }

  render() {
    this.root.clearUsed()
    const result = (
      <MCVeeContext.Provider value={this}>
        <ViewContext.Provider value={{mcvee: this, path: []}}>
        <View id={null} model={this.rootModel} namespace='default' />
      </ViewContext.Provider>
        </MCVeeContext.Provider>
    )
    console.log(this.root)
    this.root.retainUsed()
    return result
  }

  renderModel(path: path, model: any, namespace: string, setModel: modelSetter): JSX.Element {
    const viewdef = this.viewFactory(path[path.length - 1], model)

    console.log(`set ${JSON.stringify(path)} = ${JSON.stringify(model)}`)
    return viewdef[namespace]()
  }
}

export function View({id, model, namespace = 'default'}: {id: string | number, model: any, namespace?: string}) {
  const [mstate, setMstate] = useState()

  return (
    <ViewContext.Consumer>
      {
        (vc: viewContext)=> (
          <ViewContext.Provider value={{mcvee: vc.mcvee, path: [...vc.path, id]}}>
            <InnerView id={id} namespace={namespace} model={model} vc={vc} />
          </ViewContext.Provider>
        )
      }
    </ViewContext.Consumer>
  )
}

export function InnerView({id, model, namespace, vc}: {id: string | number, model: any, namespace: string, vc: viewContext}) {
  const [mstate, setMstate] = useState(model)
  const {mcvee, path} = vc

  return (
    <>
      {mcvee.renderModel([...path, id], model, namespace, setMstate)}
    </>
  )
}

const UNKNOWN = {}

declare class WeakRef<T> {
  constructor(target: T)
  deref(): T
}

type variable = {value?: any, children: simpleMap<variable>}

export type metadata = {path: path} | any

export type varCmd =
  {type: 'def', parent: string | number, id: string | number, meta: any} |
  {type: 'set', id: string | number, value: any} |
  {type: 'setLength', id: string | number, value: number} | 
  {type: 'remove', id: string | number}

/**
 * Monitors a tree of values and caches them
 *
 * When a value changes, issue an update
 *
 * Assign ids to objects and arrays and use {ref: id} as the value
 *
 */
export class Env {
  constructor(
    public model: any,
    public id2model = {} as simpleMap<WeakRef<any>>,
    public model2id = new WeakMap<any, string>(),
    public nextObjId = 0,
    public variables = {} as simpleMap<Variable>,
    public variablesRoot?: Variable,
    public nextVarId = 0,
  ) {
    this.addRef(model)
    this.variablesRoot = this.createVariable([])
  }

  createVariable(modelPath: path) {
    const varId = `modelVar-${this.nextVarId++}`

    return this.variables[varId] = new Variable(`modelVar-${varId}`, modelPath)
  }

  getValue(value: any) {
    if (typeof value !== 'function' && typeof value !== 'object') return value
    return {ref: this.addRef(value)}
  }

  addRef(obj: any) {
    if (this.model2id.get(obj)) return
    const id = this.nextObjId++

    this.id2model[id] = new WeakRef(obj)
    this.model2id.set(obj, String(id))
    return id
  }

  refresh() {
    const changes = [] as varCmd[]

    this.variablesRoot.refresh(this.model, changes, this)
    return changes
  }

  run(...cmds: varCmd[]) {
    for (const cmd of cmds) {
      switch (cmd.type) {
        case 'def':
          const parent = this.variables[cmd.parent].addChild(cmd.id, cmd.meta, this)
      }
    }
  }
}

/**
 * returns the value at a path
 */
function getValueInModel(path: path, model) {
  for (const key of path) {
    if (model) return UNKNOWN
    model = model[key]
  }
  return model
}

function sameValue(a: any, b: any) {
  return a === b || (isNaN(a) && isNaN(b))
}

class Variable {
  constructor(
    public id: string | number,
    public metadata: any,
    public value?: any,
    public list = false,
    public children = [] as Variable[],
  ) {}

  addChild(id: string | number, metadata: path, env: Env) {
    const child = new Variable(id, metadata)

    env.variables[id] = child
    return this.children[id] = child
  }

  refresh(model: any, changes: varCmd[], env: Env) {
    const value = getValueInModel(this.metadata.path, model)

    if (!sameValue(value, this.value)) {
      this.value = value
      changes.push({type: 'set', id: this.id, value: env.getValue(value)})
    }
    if (this.list) {
      if (!Array.isArray(value)) throw new Error(`Value is not an array`)
      if (value.length != this.children.length) {
        changes.push({type: 'setLength', id: this.id, value: this.children.length})
        while (this.children.length > value.length) {
          delete env.variables[this.children.pop().id]
        }
        while (this.children.length < value.length) {
          this.children.push(env.createVariable([this.children.length]))
        }
      }
    }
    for (const child of this.children) {
      child.refresh(value, changes, env)
    }
  }
}
