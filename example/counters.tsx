import React, {useState, useEffect} from "react";
import {List, ListItem, Button} from '@mui/material'
import {control, Render} from 'react-mvc-lite'
import {MCVee, View, Viewdef} from '../js/index'

interface Counter {
    name: string
    value: number
    hasInc: boolean
    hasDec: boolean
    default(): JSX.Element
}

abstract class BaseCounter extends Viewdef<{name: string, value: number}> {
    abstract default(index: number): JSX.Element

    nameValue() {
        return (
            <>
                &nbsp;
                {this.props.name('')}: {String(this.props.value(0))}
            </>
        )
    }
}

class IncrementingCounter extends BaseCounter {
    hasInc = true

    default(index: number) {
        console.log('render', this)
        return (
            <div className='mb-4'>
                <Button
                    variant='contained'
                    onClick={()=> null}>
                    Inc
                </Button>
                {this.nameValue()}
            </div>
        )
    }
}

class DecrementingCounter extends BaseCounter {
    hasDec = true

    default() {
        const controller = control(this, 'name', 'value')

        console.log('render', this)
        return (
            <div className='mb-4'>
                <Button
                    variant='contained'
                    onClick={()=> null}>
                    Dec
                </Button>
                {this.nameValue()}
            </div>
        )
    }
}

class IncDecCounter extends BaseCounter {
    hasInc = true
    hasDec = true

    default() {
        const controller = control(this, 'name', 'value')

        console.log('render', this)
        return (
            <div className='mb-4'>
                <Button
                    variant='contained'
                    onClick={()=> null}>
                    Inc
                </Button>
                &nbsp;
                <Button
                    variant='contained'
                    onClick={()=> null}>
                    Dec
                </Button>
                {this.nameValue()}
            </div>
        )
    }
}

const baseModel = {
    type: 'CounterList',
    counters: [
        {
            type: 'IncrementingCounter',
            name: 'Shoes',
            value: 0,
        },
        {
            type: 'DecrementingCounter',
            name: 'Automobiles',
            value: 10,
        },
        {
            type: 'IncDecCounter',
            name: 'Considerations',
            value: 50,
        },
    ],
}

const model = {
    0: {
        type: 'CounterList',
        counters: [1, 2, 3],
    },
    1: {
        type: 'IncrementingCounter',
        name: 'Shoes',
        value: 0,
    },
    2: {
        type: 'DecrementingCounter',
        name: 'Automobiles',
        value: 10,
    },
    3: {
        type: 'IncDecCounter',
        name: 'Considerations',
        value: 50,
    },
}

class CounterList extends Viewdef<{counters: any[]}> {
    default() {
        return (
            <>
                {this.props.counters([])
                    .map((c, i)=> <View key={i} id={i} model={model[c]} />)}
            </>
        )
    }
}

MCVee.register(CounterList, IncrementingCounter, DecrementingCounter, IncDecCounter)

export function Counters() {
    return new MCVee(model[0]).render()
}
