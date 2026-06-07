import { useParams } from 'react-router-dom';

function InvoicePreview() {
    const { invoiceId } = useParams();

    return (
        <div style={{ height: '100vh' }}>
            <iframe
                src={`https://api.postafly.com/api/v1/invoice/preview/${invoiceId}`}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title="Invoice Preview"
            />
        </div>
    );
}

export default InvoicePreview;
