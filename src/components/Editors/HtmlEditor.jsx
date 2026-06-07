import React, { useRef, useEffect } from 'react';
import { ReactSummernoteLite } from '@easylogic/react-summernote-lite';

const HtmlEditor = React.memo(({ message, onChange, summernoteRef }) => {
    const localRef = useRef();

    useEffect(() => {
        if (summernoteRef.current && message) {
            summernoteRef.current.summernote('code', message);
        }
    }, [message, summernoteRef]);

    return (
        <ReactSummernoteLite
            id="sample-editor"
            height={310}
            ref={localRef}
            placeholder="Type your content here..."
            onInit={({ note }) => {
                summernoteRef.current = note;
                if (message) {
                    note.summernote('code', message);
                }
            }}
            onChange={onChange}
        />
    );
});

export default HtmlEditor;
