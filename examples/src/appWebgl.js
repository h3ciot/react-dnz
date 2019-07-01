/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
import { Sketchpad } from 'react-dnz';
import {Button, Popover} from "antd";
import logo from './logo.svg';
type Props = {};
type State = {};

export default class appWebgl extends Component<Props, State> {
    static defaultProps = {};

    constructor(props) {
        super(props);
        this.state = {
            dataUrl: "http://127.0.0.1:1234/scene.gltf",
            areaList : [{
                key: 'rect',
                type: 'rect',
                points: [[100,100],[200,200]],
                height: 50,
                color: '#DC143C',
                onClick: function(event) {
                    console.log('event:', event);
                }
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
                    showPoint: true,
                    points: [[500,500], [500,650],[780,780], [800,800]],
                    height: 50,
                    color: '#64dcd5',
                }
            ],
        markList: [
            { key: '1', position: { x: 100, y: 100 }, z: 50, img: logo, content: 'aaaa', width: 50, height: 50, placement: 'top', dragable: true, onDrag: function(e) {console.log(e)}, onDragStop: function(e){ console.log(e)} },
            { key: '2', position: { x: 200, y: 200 }, z: 60, img: logo, content: 'bbbb', width: 50, height: 70, placement: 'top' },
            { key: '3', position: { x: 300, y: 300 }, z: 70, img: logo, content: 'cccc', width: 50, height: 70, placement: 'bottom' },
            { key: '4', position: { x: 400, y: 400 }, z: 80, img: logo, content: 'dddd', width: 50, height: 70, placement: 'bottom' },
        ]
        };
        window.changeUrl = () => {
            if(this.state.dataUrl === 'http://127.0.0.1:1234/scene.gltf') {
                this.setState({ dataUrl: 'http://127.0.0.1:1234/scene1.gltf' });
            }else {
                this.setState({ dataUrl:'http://127.0.0.1:1234/scene.gltf'});
            }
        };
        window.changeArea = () => {
            this.setState({
                areaList: [{
                    key: 'rect',
                    type: 'rect',
                    points: [[150,100],[200,200]],
                    height: 50,
                    color: '#DC143C',
                    onClick: function(event) {
                        console.log('event:', event);
                    }
                },
            {
                key: 'line',
                    type: 'line',
                points: [[250,200],[350,300]],
                height: 50,
                color: '#DC143C',
            },
            {
                key: 'circle',
                    type: 'circle',
                points: [[350,350]],
                height: 50,
                radius: 150,
                color: '#DC143C',
            },
            {
                key: 'polygon',
                    type: 'polygon',
                showPoint: true,
                points: [[500,500], [500,650],[780,780], [800,800]],
                height: 50,
                color: '#64dcd5',
            }
        ],
            })
        };
        window.changeMark = () => {
            this.setState({         markList: [
                    { key: '1', position: { x: 150, y: 150 }, z: 50, img: logo, content: 'aaaa', width: 20, height: 50, placement: 'top', dragable: true, onDrag: function(e) {console.log(e)}, onDragStop: function(e){ console.log(e)} },
                    { key: '2', position: { x: 250, y: 250 }, z: 60, img: logo, content: 'bbbb', width: 50, height: 50, placement: 'top' },
                    { key: '3', position: { x: 350, y: 350 }, z: 70, img: logo, content: 'cccc', width: 40, height: 40, placement: 'bottom' },
                    { key: '4', position: { x: 450, y: 450 }, z: 80, img: logo, content: 'dddd', width: 30, height: 30, placement: 'bottom' },
                ]})
        }
    }
    loadingStatus = (err, loading, percentage) => {
        console.log('err:', err);
        console.log('loading:', loading);
        console.log('percentage:', percentage);
    };
    captureClickPosition = (position, e) => {
        console.log('position:', position);
    };
    render() {
        const { dataUrl, markList, areaList } = this.state;
        return <div style={{ width: '100%', height: '100%' }}>
            <Sketchpad style={{ border: '1px solid #000'}} capturePosition={this.captureClickPosition} dataUrl={dataUrl} loadingStatus={this.loadingStatus} areaList={areaList} markList={markList} capture = {true} model="2d">
            </Sketchpad>
        </div>;
    }
}
