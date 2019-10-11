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
      console.log(fileContent);
      console.timeEnd('starting to read file');
      this.props.onFileLoad({
        fileContent: fileContent,
        rawFile: file
      });
    };
    reader.readAsText(file);
    console.time('starting to read file');
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
    rawFile: null,
    headerRow: 0,
    page: 0,
    columnNameMap: {},
    outputFile: null
  };

  handleFileLoad = ({ fileContent, rawFile }) => {
    const tableContent = csvToArray(fileContent);
    this.setState({
      fileContent: tableContent.slice(0, 10),
      rawFile: rawFile
    });
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

  goToMapper = page => () => {
    this.setState({
      page
    });
  }

  bingo = () => {
    const URL = `http://localhost:3000/file`;
    const formData = new FormData();
    formData.append('info', this.state.rawFile);
    formData.append('columnNameMap', JSON.stringify(this.state.columnNameMap));
    formData.append('headerRow', this.state.headerRow);

    fetch(URL, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      if (data.newFile) {
        this.setState({
          outputFile: data.newFile
        });
      }
    })
  }

  render() {
    const { fileContent, headerRow } = this.state;
    console.log(fileContent);

    if (this.state.outputFile) {
      return <a href="http://localhost:3000/outputs/info-1570812534936.csv">Download output file</a>
    }

    if (fileContent) {
      if (this.state.page === 0) {
        return (
          <div>
            <FileHeaderPreview cells={fileContent} selectedRow={headerRow} onRowChange={this.handleRowChange} />
            <button onClick={this.goToMapper(1)}>Continue</button>
          </div>
        );
      } else if (this.state.page === 1) {
        const sliceTableContent = fileContent.slice(headerRow);
        return (
          <div>
            <button onClick={this.goToMapper(2)}>Continue</button>
            <FileMapper cells={sliceTableContent} onChange={this.handleColumnMapChange} />
          </div>
        )
      } else if (this.state.page === 2) {
        // preview page. This is where user can reorder columns as they please
        const columnNameMap = this.state.columnNameMap;
        const selectedRows = [[]];

        for (let prop in columnNameMap) {
          if (columnNameMap.hasOwnProperty(prop)) {
            selectedRows[0].push(columnNameMap[prop]);
          }
        }
        for (let i = this.state.headerRow; i < fileContent.length; i++) {
          const currentRow = fileContent[i];

          const currentRowResult = [];
          for (let j = 0; j < currentRow.length; j++) {
            const isSelected = typeof columnNameMap[j] !== 'undefined';

            if (isSelected) {
              currentRowResult.push(currentRow[j]);
            }
          }

          selectedRows.push(currentRowResult);
        }

        return (
          <div>
            <h1>Does everything look good?</h1>
            <button onClick={this.bingo}>Submit</button>
            <div>
              <table>
                {selectedRows.map((row, index) => {
                  if (index === 0) {
                    return <tr>{row.map(data => {
                      return <td>New mapping name: {data}</td>
                    })}</tr>
                  } else if (index === 1) {
                    return <tr>{row.map(data => {
                      return <td>Old mapping name: {data}</td>
                    })}</tr>
                  } else {
                    return <tr>{row.map(data => {
                      return <td>{data}</td>
                    })}</tr>
                  }
                })}
              </table>
            </div>
          </div>
        );
      }
    } else {
      return <FileInput onFileLoad={this.handleFileLoad} />
    }
  }
}

render(<App />, document.querySelector('.js-root'));