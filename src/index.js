import xml2js from 'xml2js'
let vipObjectTag = `<VipObject xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" schemaVersion="5.2" xsi:noNamespaceSchemaLocation="https://raw.githubusercontent.com/votinginfoproject/vip-specification/vip52/vip_spec.xsd">`

let xmlFromFile;
let tableJson;

const onLoad = (e) => {
    xmlFromFile = e.target.result
    // parseWithXml2js(xmlFromFile)
    let json = parseWithBrowser(xmlFromFile)
    tableJson = json
    console.log(json)
    // console.log(parseJsXml(json))
    let newXml = `${vipObjectTag}${parseJsXml(json)}</VipObject>`
    let parser = new DOMParser()
    let xmlDoc = parser.parseFromString(newXml,"text/xml");
    console.log(xmlDoc)
    makeDownload(newXml)
    makeGrids()
}

const makeDownload = (someXml) => {
    let filename = 'roundtripped.xml'
    let downloadLink = document.getElementsByTagName('a')[0];
    downloadLink.classList.remove("inactive")
    downloadLink.classList.add("active")
    let xmlBlob = new Blob([someXml], {type: 'text/xml'});
    downloadLink.setAttribute('href', window.URL.createObjectURL(xmlBlob));
    downloadLink.setAttribute('download', filename);
}

const parseWithXml2js = (parseableXml) => {
    xml2js.parseString(parseableXml, (error, result)=> {
        console.log(result)
        return result
    })
}

const parseWithBrowser = (parseableXml) => {
    let parser = new DOMParser()
    let xmlDoc = parser.parseFromString(parseableXml,"text/xml");
    let tree = addChildrenToObject(xmlDoc.documentElement, {})
    return tree
}

const addChildrenToObject = (node, obj) => {
    for(let i=0; i<node.children.length; i++){
        let childObj = {}

        if(node.children[i].hasAttributes()){
            // expects maximum of 1 attribute
            childObj["@" + node.children[i].attributes[0].nodeName] = node.children[i].attributes[0].textContent
        }

        // if it has children run this again
        if(node.children[i].children.length > 0){
            addChildrenToObject(node.children[i], childObj)
        } else {
            // in this xml, either it has children or it has text content
            // not technically always true, but if our doc changes this could iterate
            childObj["#text"] = node.children[i].textContent
        }

        // check to see if there's already a child object of this type
        // if it's not an array, make it an array
        if(!!obj[node.children[i].tagName] && !Array.isArray(obj[node.children[i].tagName])){
        
            let siblings = []
            siblings.push(obj[node.children[i].tagName])
            siblings.push(childObj)
            obj[node.children[i].tagName] = siblings

        }else if(!!obj[node.children[i].tagName] && Array.isArray(obj[node.children[i].tagName])){
            obj[node.children[i].tagName].push(childObj)

        } else {
        // if it has no siblings put it in directly
            obj[node.children[i].tagName] = childObj
        }
    }
    return obj
}

const parseJsXml = (obj) => {
    let xml = ''

    for(let key in obj){
        if (obj[key] instanceof Array){
            for(let i = 0; i < obj[key].length; i++){
                // if key has child beginning with @
                if(Object.keys(obj[key][i])[0].startsWith("@")){
                    let attrname = Object.keys(obj[key][i])[0]
                    let attrvalue = obj[key][i][attrname]
                    let attribute = attrname.substr(1)
                    // add attribute to opening tag
                    xml += `<${key} ${attribute}="${attrvalue}">`
                } else {
                    xml += `<${key}>`
                }
                xml += parseJsXml(obj[key][i])
                xml += `</${key}>`
            }
        } else if (typeof (obj[key]) == 'object' ){
            // if key has child beginning with @
            if (Object.keys(obj[key])[0].startsWith("@")){
                let attrname = Object.keys(obj[key])[0]
                let attrvalue = obj[key][attrname]
                let attribute = attrname.substr(1)
                // add attribute to opening tag
                xml += `<${key} ${attribute}="${attrvalue}">`
            } else {
                xml += `<${key}>`
            }
            xml += parseJsXml(obj[key])
            xml += `</${key}>`
        } else if (key.charAt(0) == "@"){
            // here, discard this key
        } else if (key.charAt(0) == "#"){
            xml += obj[key]
        }
    }
    return xml + ''
}

document.addEventListener('click', (e) => {
    if(e.target.id == 'uploader'){
        let data = document.getElementById('file').files[0];
        const reader = new FileReader()
        reader.addEventListener('load', e => onLoad(e))
        reader.readAsText(data)
    }
})

const makeGrids = () => {
    // Candidates
    // CandidateContest
    // CandidateSelection
    // Election
    // ElectoralDistrict
    // Party
    // Person
    // State
    
    for(let key in tableJson){
        if(!Array.isArray(tableJson[key])){
            let singleRow = []
            singleRow.push(tableJson[key])
            tableJson[key] = singleRow
        }

        let header = document.createElement("h3")
        let gridDiv = document.createElement("div")
        gridDiv.id = `grid-${key}`
        let headerText = document.createTextNode(`${key}s`)
        header.appendChild(headerText)
        document.getElementById("grids").appendChild(header)
        document.getElementById("grids").appendChild(gridDiv)
        let gridColumns = []
        // check the first object to get our keys/column vals
        for(let i = 0; i < Object.keys(tableJson[key][0]).length ; i++){
            let colType = Object.keys(tableJson[key][0])[i] == "ContactInformation" || Object.keys(tableJson[key][0])[i] == "ExternalIdentifiers" ? "longText" : "default"
            gridColumns[i] = { field: Object.keys(tableJson[key][0])[i], sortable: true, filter: true , type: colType}
        }

        // let gridRows = tableJson[key]
        let gridRows = []
        // for every item in the array iterate through according to keys
        for(let i = 0; i < tableJson[key].length; i++){
            gridRows[i] = {}
            for(let columnName in tableJson[key][0]){
                gridRows[i][columnName] = flatFormat(tableJson[key][i][columnName])
            }
        }

        let gridOptions = {
            columnDefs: gridColumns,
            rowData:    gridRows,
            // defaultColDef : {
            //     width: 150,
            //     // wrapText: true,
            // },
            columnTypes : {
                default :{
                    width: 150,
                },
                longText: {
                    width: 300,
                    autoHeight: true,
                    cellStyle: { "white-space": "normal" }
                }
            }
        }
        
        new agGrid.Grid(gridDiv, gridOptions);
    }
}

const flatFormat = (child) =>{
    let flat = ''
    if(typeof(child)=="string"){
        flat += child
    } else if (child && child["#text"] !== undefined) {
        flat += child['#text']
    } else if (child && child["Text"] && child["Text"]["#text"] !== undefined) {
        flat += child["Text"]["#text"]
    } else if (child){
        // Contact Info && External Ids
        for (let key in child){
            flat += "\n" + flatFormat(child[key])
        }
        // flat = JSON.stringify(child)
        // flat = flat.replace(/[\{\}\[\]]+/g,'').replace(/[\"]+/g,' ')
    }
    return flat
}