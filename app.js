const fileInput = document.querySelector('#fileInput');
const fileTree = document.querySelector('#fileTree');
const fileinputbtn = document.getElementById('fileInputbtn')
const gobackbtn = document.getElementById('goback')
const loading = document.getElementById('loading')

let isLoading = false;

fileInput.addEventListener('change', handleFileSelect, false);

fileinputbtn.addEventListener('click',()=>{
    fileInput.click()
})

function handleFileSelect(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  fileinputbtn.style.display= 'none';
  gobackbtn.style.display = 'flex'
  gobackbtn.addEventListener('click',()=>{
    window.location.reload()
  })

  loading.style.display = 'block';
  isLoading = true;

  reader.onload = function (event) {
    const zip = new JSZip();

    zip.loadAsync(event.target.result)
      .then(function (contents) {
        const treeData = convertZipToTreeData(contents);
        $(fileTree).jstree({
          'core': {
            'data': treeData
          }
        });

        $(fileTree).on('select_node.jstree', function(e, data) {
          if (data.node.li_attr && data.node.li_attr['data-file-name']) {
            const filename = data.node.li_attr['data-file-name'];
            const fileData = contents.files[filename];
            fileData.async('blob').then(function (data) {
              const downloadLink = document.createElement('a');
              downloadLink.href = URL.createObjectURL(data);
              downloadLink.download = filename;
              downloadLink.click();
              loading.style.display = 'none';
              isLoading = false;
            });
          }
        });
        loading.style.display = 'none';
        isLoading = false;
      })

      .catch(function (error) {
        console.error(error);
        loading.style.display = 'none';
        isLoading = false;
      });
  };

  reader.readAsArrayBuffer(file);
}

function convertZipToTreeData(contents) {
  const treeData = [{
    "text": "Zip File Contents",
    "children": []
  }];

  Object.keys(contents.files).forEach(function (filename) {
    if (filename.slice(-1) !== '/') {
      const fileData = contents.files[filename];
      const pathParts = filename.split('/');
      let currentNode = treeData[0];

      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        let nextNode = currentNode.children.find(function (child) {
          return child.text === part;
        });

        if (!nextNode) {
          nextNode = {
            "text": part,
            "children": []
          };
          currentNode.children.push(nextNode);
        }

        currentNode = nextNode;
      }

      currentNode.li_attr = {
        "data-file-name": filename
      };
      currentNode.icon = "jstree-file";
    }
  });

  return treeData;
}