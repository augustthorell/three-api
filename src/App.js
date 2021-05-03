import React, { useState, useRef, Suspense } from 'react'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Canvas, extend, useFrame, useThree } from 'react-three-fiber'
import { useSpring, a } from 'react-spring/three'
import './style.css'
import * as THREE from 'three'
import JSONfont from "./fonts/Cascadia_Code.json";
import { Text } from "troika-three-text";
import Model from './model'
import Axios from 'axios'


extend({ OrbitControls, Text });

const Controls = () => {
    const orbitRef = useRef();
    const { camera, gl } = useThree();


    useFrame(() => {
        orbitRef.current.update()
    })
    return (
        <orbitControls

            maxPolarAngle={Math.PI / 4} // Change viewing angle here
            minPolarAngle={Math.PI / 4} // And here
            args={[camera, gl.domElement]}
            ref={orbitRef}

        />
    )
}

const Plane = () => (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeBufferGeometry
            attach='geometry'
            args={[10000, 10000]}

        />
        <meshPhysicalMaterial attach='material' color='red' />
    </mesh>
)

const Title = () => {
    const font = new THREE.FontLoader().parse(JSONfont);

    // configure font geometry
    const textOptions = {
        font,
        size: 20,
        height: 5
    };

    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[-180, 0, -95]}
            castShadow
        >
            <textGeometry attach='geometry' args={['Current Weather In Stockholm', textOptions]} />
            <meshStandardMaterial attach='material' />
        </mesh>

    )
}
const Weather = ({ weather, position }) => {
    const font = new THREE.FontLoader().parse(JSONfont);

    const [opts, setOpts] = useState({
        font: font,
        fontSize: 12,
        color: "#99ccff",
        maxWidth: 100,
        lineHeight: 1,
        letterSpacing: 0,
        textAlign: "left",
        materialType: "MeshPhongMaterial"
    });

    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={position}
        >
            <text
                {...opts}
                text={weather.degree ? [weather.degree + ' and ' + weather.type] : ''}
                font={font}
                anchorX="center"
                anchorY="middle"
            >
                {opts.materialType === "MeshPhongMaterial" ? (
                    <meshPhongMaterial attach="material" color={opts.color} />
                ) : null}
            </text>
        </mesh >
    )
}

const SL = ({ travel, position }) => {
    const font = new THREE.FontLoader().parse(JSONfont);
    const [opts, setOpts] = useState({
        font: font,
        fontSize: 12,
        color: "#99ccff",
        maxWidth: 250,
        lineHeight: 1,
        letterSpacing: 0,
        textAlign: "left",
        materialType: "MeshPhongMaterial"
    });

    return (
        <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh>
                <text
                    {...opts}
                    text={travel[0] ? 'Next Departure from Sickla to Medborgarplatsen is: ' : ''}
                    font={font}
                    anchorX="center"
                    anchorY="middle"
                >
                    {opts.materialType === "MeshPhongMaterial" ? (
                        <meshPhongMaterial attach="material" color={opts.color} />
                    ) : null}
                </text>
            </mesh>
            <mesh position={[-28, -30, 2]}>
                <text
                    {...opts}
                    text={travel[0] ? travel[0].LegList.Leg[0].Origin.name + ' at ' + travel[0].LegList.Leg[0].Origin.time : ''}
                    font={font}
                    anchorX="center"
                    anchorY="middle"
                >
                    {opts.materialType === "MeshPhongMaterial" ? (
                        <meshPhongMaterial attach="material" color={opts.color} />
                    ) : null}
                </text>
                <text
                    position={[6, -15, 0]}
                    {...opts}
                    text={travel[0] ? 'to ' + travel[0].LegList.Leg[0].Destination.name : ''}
                    font={font}
                    anchorX="center"
                    anchorY="middle"
                >
                    {opts.materialType === "MeshPhongMaterial" ? (
                        <meshPhongMaterial attach="material" color={opts.color} />
                    ) : null}
                </text>
            </mesh>
        </group>
    )
}




const Button = ({ test, position, title }) => {

    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);
    const [active, setActive] = useState(false);
    const font = new THREE.FontLoader().parse(JSONfont);

    // configure font geometry
    const textOptions = {
        font,
        size: 5,
        height: 5
    };
    const props = useSpring({
        scale: active ? [120, 15, 1] : [120, 15, 30],
        color: hovered ? 'hotpink' : 'blue',
    })
    const text = useSpring({
        scale: active ? [1, 1, 0.1] : [1, 1, 3],

    })


    function click() { setTimeout((() => setActive(false)), 400); }
    return (
        <group position={position}>
            <a.mesh
                ref={meshRef}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                castShadow
                onClick={() => {
                    setActive(!active)
                    click();
                    test();
                }}
                scale={props.scale}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow

            >
                <boxBufferGeometry
                    attach='geometry'
                    args={[1, 1, 1]}
                />
                <a.meshPhysicalMaterial attach='material' color={props.color} />

            </a.mesh>
            <a.mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[-55, 1, 2]}
                castShadow
                scale={text.scale}
            >
                <textGeometry attach='geometry' args={[title, textOptions]} castShadow />
                <meshStandardMaterial attach='material' />
            </a.mesh>
        </group>
    )
}

const ModelComponent = ({ surprise }) => {
    if (surprise === true) {
        return (
            <Model />
        )
    } else {
        return null
    }
}

const App = () => {
    const [weather, setWeather] = useState({
        degree: '',
        type: '',
    })

    const [travel, setTravel] = useState([])
    const [surprise, setSurprise] = useState(false)


    const weatherFetch = () => {
        Axios.get('https://goweather.herokuapp.com/weather/Stockholm').then((response) => {
            setWeather({ degree: response.data.temperature, type: response.data.description })
        })
    }

    const travelFetch = () => {
        const apiKey = process.env.REACT_APP_APIKEY
        Axios.get(`https://api.resrobot.se/v2/trip?key=${apiKey}&originId=740024807&destId=740021654&format=json&type=JNY&WALK=0&originWalk=0&destWalk=0`).then((response) => {
            setTravel(response.data.Trip)
        })
    }
    const surpriseClick = () => {
        setSurprise(!surprise)
    }

    return (
        <Canvas
            camera={{ position: [-20, 30, 400] }}
            onCreated={({ gl }) => {
                gl.shadowMap.enabled = true
                gl.shadowMap.type = THREE.PCFSoftShadowMap
            }}
        >
            <ambientLight intensity={0.4} />
            <spotLight position={[150, 200, 100]} penumbra={1} castShadow />
            <fog attach="fog" args={["black", 100, 800]} />
            <Controls />
            <Plane />
            <Title />

            <Weather weather={weather} position={[180, 0.5, 2]} />
            <SL travel={travel} position={[-120, 0.5, 2]} />

            <Suspense fallback='null'>
                <ModelComponent surprise={surprise} />
            </Suspense>
            <Button test={weatherFetch} title={'Click to get weather report'} position={[30, 0, 100]} />
            <Button test={travelFetch} title={'Click to see the next train'} position={[30, 0, 130]} />
            <Button test={surpriseClick} title={'    Click for a surprise'} position={[30, 0, 160]} />


        </Canvas>
    )
}

export default App
