import React from 'react';
import {
    Bell,
    Xmark
  } from '../utils/icons';

const NotificationPanel = () => {
    return (
        <li className="header-notification">
        <a
          aria-controls="notificationcanvasRight"
          className="d-block head-icon position-relative"
          data-bs-target="#notificationcanvasRight"
          data-bs-toggle="offcanvas"
          href="#"
          role="button"
        >
          <Bell size={24} />
          <span className="position-absolute translate-middle p-1 bg-success border border-light rounded-circle animate__animated animate__fadeIn animate__infinite animate__slower"></span>
        </a>
        <div
          aria-labelledby="notificationcanvasRightLabel"
          className="offcanvas offcanvas-end header-notification-canvas"
          id="notificationcanvasRight"
          tabIndex="-1"
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="notificationcanvasRightLabel">
              Notification
            </h5>
            <button
              aria-label="Close"
              className="btn-close"
              data-bs-dismiss="offcanvas"
              type="button"
            ></button>
          </div>
          <div className="offcanvas-body notification-offcanvas-body app-scroll p-0">
            <div className="head-container notification-head-container">
              {/* Notification Messages */}
              <div className="notification-message head-box">
                <div className="message-images">
                  <span className="bg-secondary h-35 w-35 d-flex-center b-r-10 position-relative">
                    <img
                      alt="avtar"
                      className="img-fluid b-r-10"
                      src="/images/ai_avtar/6.jpg"
                    />
                    <span className="position-absolute bottom-30 end-0 p-1 bg-secondary border border-light rounded-circle notification-avtar"></span>
                  </span>
                </div>
                <div className="message-content-box flex-grow-1 ps-2">
                  <a className="f-s-15 text-secondary mb-0" href="./read_email.html" target="_blank">
                    <span className="f-w-500 text-secondary">Gene Hart</span> wants to edit{" "}
                    <span className="f-w-500 text-secondary">Report.doc</span>
                  </a>
                  <div>
                    <a className="d-inline-block f-w-500 text-success me-1" href="#">
                      Approve
                    </a>
                    <a className="d-inline-block f-w-500 text-danger" href="#">
                      Deny
                    </a>
                  </div>
                  <span className="badge text-light-primary mt-2"> sep 23 </span>
                </div>
                <div className="align-self-start text-end">
                  <Xmark size={16} className="close-btn" />
                </div>
              </div>
              {/* Add more notification messages here as needed */}
            </div>
          </div>
        </div>
      </li>
    );
  };
  
  export default NotificationPanel;
  