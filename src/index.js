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
  render() {
    return (
      <table>
        {this.props.cells.map(row => {
          return (
            <tr>
              {row.map(cell => {
                return <td>{cell}</td>
              })}
            </tr>
          )
        })}
      </table>
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
    fileContent: undefined
  };

  handleFileLoad = fileContent => {
    this.setState({ fileContent });
  }

  render() {
    const { fileContent } = this.state;
    if (fileContent) {
      const tableContent = csvToArray(fileContent);
      return <FileHeaderPreview cells={tableContent} />
    } else {
      return <FileInput onFileLoad={this.handleFileLoad} />
    }
  }
}


render(<App />, document.querySelector('.js-root'));