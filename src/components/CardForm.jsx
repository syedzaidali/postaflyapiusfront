import {
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import { useState } from 'react';
import apiRoutes from '../routes/api/apiRoutes';

const cardElementStyle = {
    style: {
        base: {
            fontWeight: 400,
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            lineHeight: '38px',
            border: '1px solid #dee2e6',
            color: '#2c3030',
            backgroundColor: '#fff',
            padding: '0 15px',
            '::placeholder': {
                color: '#ccc',
            },
        },
        invalid: {
            color: '#fb9696',
        }
    },
};

const CardForm = ({
    setReqLoader,
    setShowMessageSuccess,
    setDisplayMessageSuccess,
    setDisplayMessageError,
    setShowMessageError,
    setMessageText,
    closeMenu,
    fetchPaymentMethodsData
}) => {
    const stripe    = useStripe();
    const elements  = useElements();

    const token  = localStorage.getItem('auth_token');

    const addPaymentMethodUrl = apiRoutes.createPaymentMethod;

    const [cardName, setCardName] = useState("");
    const [loader, setLoader] = useState(false);

    const handleProcessPaymentMethod = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoader(true);

        const cardElement = elements.getElement(CardNumberElement);
       
        
        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
                name: cardName,
            },
        });

        if (error) {
            setMessageText(error.message);
            setDisplayMessageError(true);
            setLoader(false);
            
            setTimeout(() => {
                setShowMessageError(false);
            }, 8000);

            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText("");
            }, 8000);

            return;
        }

        console.log("Payment Method Created:", paymentMethod);

        try {
            const response = await fetch(addPaymentMethodUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    payment_method_id: paymentMethod.id
                })
            });

            const result = await response.json();

            if (result.success) {
                fetchPaymentMethodsData();
                setMessageText("Payment method added successfully!");
                setDisplayMessageSuccess(true);
                closeMenu(); 
                
                setTimeout(() => {
                    setShowMessageSuccess(false);
                }, 8000);

                setTimeout(() => {
                    setDisplayMessageSuccess(false);
                    setMessageText("");
                }, 8000);
            } else {
                setMessageText(result.message || "Failed to add payment method.");
                setDisplayMessageError(true);

                setTimeout(() => {
                    setShowMessageError(false);
                }, 8000);

                setTimeout(() => {
                    setDisplayMessageError(false);
                    setMessageText("");
                }, 8000);
            }
        } catch (err) {
            console.error("API error:", err);
            setMessageText("Something went wrong. Please try again.");
            setDisplayMessageError(true);

            setTimeout(() => {
                setShowMessageError(false);
            }, 8000);

            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText("");
            }, 8000);
        } finally {
            setLoader(false);
        }
    };

    return (
        <div className='row'>
            <div className='col-md-6'>
                <form onSubmit={handleProcessPaymentMethod}>
                    <div className='row'>
                        <div className="form-group col-md-12 mb-3">
                            <label>Name On Card</label>
                            <input type="text"
                                name="title"
                                value={cardName}
                                onChange={(e) => setCardName( e.target.value) }
                                className="form-control" />
                        </div>
                        <div className="form-group col-md-12 mb-3">
                            <label>Card Number</label>
                            <div className='b-1-light b-r-50 pa-s-15 pa-e-15 txt-ellipsis-1'>
                                <CardNumberElement options={{ showIcon: true, ...cardElementStyle }} />
                            </div>
                        </div>
                        
                        <div className="form-group col-md-6 mb-3">
                            <label>Expiry</label>
                            <div className='b-1-light b-r-50 pa-s-15 pa-e-15 txt-ellipsis-1'>
                                <CardExpiryElement options={cardElementStyle} />
                            </div>
                        </div>

                        <div className="form-group col-md-6 mb-3">
                            <label>CVC</label>
                            <div className='b-1-light b-r-50 pa-s-15 pa-e-15 txt-ellipsis-1'>
                                <CardCvcElement options={cardElementStyle} />
                            </div>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-30">
                        <button type="submit" className="btn btn-light-primary b-r-22"  disabled={!stripe}>
                            Add Payment Method
                        </button>

                        {loader && (
                            <div className="left d-flex align-items-center">
                                <span aria-hidden="true" className="spinner-border spinner-border-sm me-2 ms-2" role="status"></span>
                                Processing
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CardForm;
