/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
import { Sketchpad, CustomItems, CustomItem } from 'react-dnz';
import {Button, Popover} from "antd";
type Props = {};
type State = {};

export default class appWebgl extends Component<Props, State> {
    static defaultProps = {};

    constructor(props) {
        super(props);
        this.state = {};
    }
    loadingStatus = (err, loading, percentage) => {
        console.log('err:', err);
        console.log('loading:', loading);
        console.log('percentage:', percentage);
    };
    render() {
        const areaList = [            {
            key: 'rect',
            type: 'rect',
            points: [[100,100],[200,200]],
            height: 50,
            color: '#DC143C',
        },
            {
                key: 'line',
                type: 'line',
                points: [[200,200],[300,300]],
                height: 50,
                color: '#DC143C',
            },
            {
                key: 'circle',
                type: 'circle',
                points: [[300,300]],
                height: 50,
                radius: 100,
                color: '#DC143C',
            },
            {
                key: 'polygon',
                type: 'polygon',
                points: [[500,500], [500,650],[780,780], [800,800]],
                height: 50,
                color: '#64dcd5',
            }
        ];
        const dataUrl = "http://127.0.0.1:1234/scene.gltf";
        return <div style={{ width: '100%', height: '100%' }}>
            <Sketchpad style={{ border: '1px solid #000'}} dataUrl={dataUrl} loadingStatus={this.loadingStatus} areaList={areaList}>
                <CustomItems>
                    <CustomItem key="top" position={{x: 100, y: 100}} offset={{top:0,left:0}}>
                        <Popover autoAdjustOverflow={false} placement="bottomRight" content={<div style={{ width: 200, height: 300, background: '#0f0'}}/>} trigger="click">
                            <Button>topLeft</Button>
                        </Popover>
                    </CustomItem>
                </CustomItems>
            </Sketchpad>
        </div>;
    }
}
