//BouncyComponent.js
import React from 'react';
import './style/loading.css';

const BouncyComponent = () => {
    return (
            <div className="box effect">

                <div className="scene">
                    <img className="car" src='/images/car.svg' alt="Car" />
                    <img className="poof" src='/images/poof.svg' alt="Poof" />
                    <img className="sign" src='/images/sign.svg' alt="Sign" />
                    <em>LOADING...</em>
                </div>
            </div>
        
    );
};

export default BouncyComponent;
