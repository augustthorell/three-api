import { useLoader, useFrame } from 'react-three-fiber';
import {
    GLTFLoader
} from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three'
import mod from './assets/dancing.glb'

const Model = props => {
    const model = useLoader(
        GLTFLoader,
        mod
    )

    let mixer
    if (model.animations.length) {
        mixer = new THREE.AnimationMixer(model.scene);
        model.animations.forEach(clip => {
            const action = mixer.clipAction(clip)
            action.play();
        });
    }

    useFrame((state, delta) => {
        mixer?.update(delta)
    })

    model.scene.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
            child.material.side = THREE.FrontSide
        }
    })

    return (
        <primitive
            object={model.scene}
            scale={50}
            position={[30, 0, 10]}
        />
    )
}

export default Model;