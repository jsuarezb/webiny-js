import React from "react";

export interface Element {
    id: string;
    type: string;
    path: string[];
    data: ElementData;
    elements: Element[];
}

export interface ElementData {
    settings?: Record<string, any>;
    [key: string]: any;
}

export type Content = Element;

export interface Theme {
    [key: string]: any;
}

export interface ElementComponentProps {
    element: Element;
}

export type ElementComponent = React.ComponentType<ElementComponentProps>;

export type ElementStylesHandler = (args: {
    element: Element;
    breakpointName: string;
    breakpoint: Breakpoint;
}) => React.CSSProperties;

export interface Breakpoint {
    mediaQuery: string;
}