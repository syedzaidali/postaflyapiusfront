import { useParams } from 'react-router-dom';
import apiRoutes from '../routes/api/apiRoutes';

function InvoicePreview() {
    const { invoiceId } = useParams();

    return (
        <div style={{ height: '100vh' }}>
            <iframe
                src={apiRoutes.invoicePreview(invoiceId)}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title="Invoice Preview"
            />
        </div>
    );
}

export default InvoicePreview;
