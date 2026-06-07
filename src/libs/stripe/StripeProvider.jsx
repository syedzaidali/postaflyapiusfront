import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe('pk_test_51IQcS5Ky2ugBtdJROOmjs7YzWzKZ7jgIKYB7U8DfnAexhb1IEx8FFoJcqyC4Ai8An21jUZ5nkOQ6TZ2ZnvBWPNXL00gDZYhLTS');

const StripeProvider = ({ children }) => {
  return <Elements stripe={stripePromise}>{children}</Elements>;
};

export default StripeProvider;
