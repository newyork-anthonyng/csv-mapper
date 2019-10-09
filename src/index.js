import { render, h, Component } from 'preact';

/*
What data do we need to send to backend?
* We need the file
* Where the header column starts
* What columns we want from the source files?
* For those selected columns, what name and order do we need?
*/

function csvToArray(csv = '') {
  const rows = csv.split('\n');
  const result = [];
  rows.forEach(row => {
    result.push(row.split(','));
  });

  return result;
}

function transformCells(cells) {
  // we only need ~5 rows to show a preview
  const truncatedRows = cells.slice(0, 6);
  const transformedCells = [];
  for (let i = 0; i < truncatedRows.length; i++) {
    const currentRow = truncatedRows[i];

    for (let j = 0; j < currentRow.length; j++) {
      if (transformedCells[j] === undefined) {
        transformedCells[j] = [];
      }
      transformedCells[j].push(currentRow[j]);
    }
  }
  return transformedCells;
}

class FileMapper extends Component {
  state = {
    columnMappingNames: {}
  }

  handleChange = columnIndex => e => {
    this.props.onChange(columnIndex)(e);
  }

  render() {
    const { cells } = this.props;
    const transformedCells = transformCells(cells);

    return (
      <div>
        {transformedCells.map((column, columnIndex) => {
          return (
            <div>
              <input type="text" onInput={this.handleChange(columnIndex)}/>
              <table>
                {column.map((cell, index) => {
                  return <tr style={index === 0 && { backgroundColor: '#dce7ff'}}><td>{cell}</td></tr>
                })}
              </table>
            </div>)
        })}
      </div>
    );
  }
}

class FileHeaderPreview extends Component {
  state = { headerRow: 0 }

  handleClick = rowIndex => {
    return () => {
      this.props.onRowChange(rowIndex);
    }
  }

  render() {
    return (
      <div>
        <p>Which row is the header in?</p>

        <table>
          {this.props.cells.map((row, rowIndex) => {
            return (
              <tr>
                {row.map(cell => {
                  const highlightStyle = { backgroundColor: '#dce7ff' };
                  const isHighlighted = rowIndex === this.props.selectedRow;

                  return <td onClick={this.handleClick(rowIndex)} style={isHighlighted && highlightStyle}>{cell}</td>
                })}
              </tr>
            )
          })}
        </table>
      </div>
    );
  }
}

class FileInput extends Component {
  ref = null;

  setRef = dom => {
    this.ref = dom;
  }

  handleChange = () => {
    const file = this.ref.files[0];

    const reader = new FileReader();
    reader.onload = e => {
      const fileContent = e.target.result;
      this.props.onFileLoad(fileContent);
    };
    reader.readAsText(file);
    console.log('starting to read file');
  }

  render() {
    return (
      <input
        ref={this.setRef}
        type="file"
        onchange={this.handleChange}
      ></input>
    )
  }
}

class App extends Component {
  state = {
    fileContent: undefined,
    headerRow: 0,
    page: 0,
    columnNameMap: {}
  };

  handleFileLoad = fileContent => {
    const tableContent = csvToArray(fileContent);
    this.setState({ fileContent: tableContent.slice(0, 50) });
  }

  handleRowChange = rowIndex => {
    this.setState({ headerRow: rowIndex });
  }

  handleColumnMapChange = columnIndex => e => {
    const newColumnNameMap = Object.assign({}, this.state.columnNameMap);
    newColumnNameMap[columnIndex] = e.target.value;
    this.setState({
      columnNameMap: newColumnNameMap
    });
  }

  goToMapper = () => {
    this.setState({
      page: 1
    });
  }

  render() {
    const { fileContent, headerRow } = this.state;

    if (fileContent) {
      if (this.state.page === 0) {
        return (
          <div>
            <FileHeaderPreview cells={fileContent} selectedRow={headerRow} onRowChange={this.handleRowChange} />
            <button onClick={this.goToMapper}>Continue</button>
          </div>
        );
      } else if (this.state.page === 1) {
        const sliceTableContent = tableContent.slice(headerRow);
        return (
          <div>
            <FileMapper cells={sliceTableContent} onChange={this.handleColumnMapChange} />
          </div>
        )
      }
    } else {
      return <FileInput onFileLoad={this.handleFileLoad} />
    }
  }
}

render(<App />, document.querySelector('.js-root'));