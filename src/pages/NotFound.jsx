import React, { useState, useEffect } from "react";
import "../assets/css/notfound.css";
import { useNavigate } from "react-router-dom";

const Notfound = () => {
    const navigate = useNavigate();

    return (
        <main className="error-page">
            <div className="container">
                <div className="d-flex align-items-center gap-5">
                    <div className="notfoundText">
                        <h1>404</h1>
                    </div>
                    <div className="contentNotFound">
                        <h2>
                            <svg
                                aria-hidden="true"
                                class="w-6 h-6 text-red-500 dark:text-red-600"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                            </svg>
                            <span class="text-xl font-medium text-gray-600 sm:text-2xl dark:text-light">
                                Oops! Page not found.
                            </span>
                        </h2>

                        <p class="text-base font-normal text-gray-600 dark:text-gray-300">
                            The page you ara looking for was not found.
                        </p>

                        <p class="text-base font-normal text-gray-600 dark:text-gray-300">
                            You may return to &nbsp;
                            <a href="/" class="text-blue-600 hover:underline dark:text-blue-500">home page</a>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Notfound;
