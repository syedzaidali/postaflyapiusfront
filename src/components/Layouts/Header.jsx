import React, {useState} from 'react';
import NotificationPanel from '../NotificationPanel';
import ProfilePanel from '../ProfilePanel';
import {
    ViewGrid,
  } from '../../utils/icons';

const Header = ({ onToggleNav }) => {    
    return (
        <header className="header-main">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-6 col-sm-4 d-flex align-items-center header-left p-0">
                        <span className="header-toggle me-3" onClick={onToggleNav}>
                            <ViewGrid />
                        </span>
                    </div>
                    <div className="col-6 col-sm-8 d-flex align-items-center justify-content-end header-right p-0">
                        <ul className="d-flex align-items-center">
                            <ProfilePanel />
                        </ul>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
