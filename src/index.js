import { render, h, Component } from 'preact';

function csvToArray(csv = '') {
  const rows = csv.split('\n');
  const result = [];
  rows.forEach(row => {
    result.push(row.split(','));
  });

  return result;
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

  handleChange = e => {
    const file = this.ref.files[0];

    const reader = new FileReader();
    reader.onload = e => {
      const fileContent = e.target.result;
      this.props.onFileLoad(fileContent);
    };
    reader.readAsText(file);
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
    headerRow: 0
  };

  handleFileLoad = fileContent => {
    this.setState({ fileContent });
  }

  handleRowChange = rowIndex => {
    this.setState({ headerRow: rowIndex });
  }

  render() {
    const { fileContent, headerRow } = this.state;
    if (fileContent) {
      const tableContent = csvToArray(fileContent);
      return <FileHeaderPreview cells={tableContent} selectedRow={headerRow} onRowChange={this.handleRowChange} />
    } else {
      return <FileInput onFileLoad={this.handleFileLoad} />
    }
  }
}


render(<App />, document.querySelector('.js-root'));