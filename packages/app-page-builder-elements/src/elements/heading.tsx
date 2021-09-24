import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementComponent } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-heading": any;
        }
    }
}

const defaultStyles = { display: "block" };

const Heading: ElementComponent = ({ element }) => {
    const { getStyles } = usePageElements();

    const tag = element.data.text.desktop.tag || "h1";
    return (
        <pb-heading class={getStyles({ element, styles: defaultStyles })}>
            {React.createElement(tag, {
                dangerouslySetInnerHTML: { __html: element.data.text.data.text }
            })}
        </pb-heading>
    );
};

export const createHeading = () => Heading;