
React Flex Data
===============

React Flex Data is a minimalistic tables implementations for React. They rely heavily on flexbox and do not use any table dom elements. 



Features:
* Fully responsive flex box grid tables.
* Use `flex` to create relative table widths.
* Handlers for row and cell taps, can be used with the headers for sorting.
* Sort of modeled after Material-UI tables but not really.

Not-Features:
* No scrolling list
* No sorting
* No pagination

Prerequisites: 
* React 14+
* [react-tap-events-plugin](https://github.com/zilverline/react-tap-event-plugin) is required.



Getting started
---------------

Install `react-flex-data` using npm.

```shell
npm install react-flex-data
```

### Basic Example

```javascript
import {Table, TableHeader, TableHeaderColumn, TableBody, TableRow, TableRowColumn} from 'react-flex-data';
import _ from 'lodash';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();


const DATA = [
    {
        name: 'Han',
        class: 'Rogue',
        skills: 'Piloting, Marksmanship, Guile, Subterfuge',
        primary: 'Blaster'
    },
    {
        name: 'Leia',
        class: 'Leader',
        skills: 'Diplomacy, Finance, Robotics',
        primary: 'Rally'
    },
    {
        name: 'Luke',
        class: 'Jedi',
        skills: 'Swordplay, Force Powers, Moral Ambiguity',
        primary: 'Lightsaber'
    },
    {
        name: 'Chewbaka',
        class: 'Ranger/Berzerker',
        skills: 'Strength, Marksmanship, Wrestling, Pie Eating',
        primary: 'Bowcaster'
    }
];


export default function() {
    return (
        <Table
            rowHeight={25}
            columnRatio={[2,2,4,2]}
            altColor="#cfcfcf"
        >
            <TableHeader>
               {Object.keys(DATA[0]).map((k) => <TableHeaderColumn key={k}>{k}</TableHeaderColumn>)}
            </TableHeader>
            <TableBody>
                {DATA.map((row, i) => {
                    return (
                        <TableRow key={i}>
                            {_.map(row, (col, k) => <TableRowColumn key={`clol_${k}_row_${i}`}>{col}</TableRowColumn>)}
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}


```


#### Properties

* `rowHeight:Number` - height of row in pixels
* `columnRatio:Array` - relative widths of all columns
* `altColor:String` - css color value (uint, rgb, rgba) for alternating rows
* `<TableRow>.rowInteraction` - handler for when clicking on a row. Params: `(TapEvent, rowIndex)`
* `<TableRowColumn>.columnInteraction` - handler for when clicking on a column. Params: `(TapEvent, colIndex)`
* `<TableHeaderColumn>.columnInteraction` - handler for when clicking on a header column. Params: `(TapEvent, colIndex)`


