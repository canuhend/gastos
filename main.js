// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
// import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"
import {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/9.6.8/firebase-auth.js";
import {getFirestore, collection, setDoc, addDoc, getDocs, deleteDoc, doc, updateDoc} from "https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBtUe5lPDu_v0dBXXfWA5-_qHIhWe9MnvU",
    authDomain: "gastos-b8b14.firebaseapp.com",
    projectId: "gastos-b8b14",
    storageBucket: "gastos-b8b14.appspot.com",
    messagingSenderId: "446713870612",
    appId: "1:446713870612:web:012bc543ff5fd3ec8aea01"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore();
const auth = getAuth();


//---------------auth-----------------
let log_button = document.getElementById('log-button')

let auth_form = document.getElementById('auth-form')

let submit_button = document.getElementById('submit')

let log_out_button = document.getElementById('log-out-button')

log_button.addEventListener('click', () => {
    if (auth_form.style.display == 'flex') {
        auth_form.style.display = 'none'
    }
    else {
        auth_form.style.display = 'flex'
    }
})

submit_button.addEventListener('click', (e) => {
    e.preventDefault()

    signInWithEmailAndPassword(auth, auth_form[0].value, auth_form[1].value)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
            console.log('Success log in')
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage)
      });

    auth_form.style.display = 'none'
})

log_out_button.addEventListener('click', () => {
    let actualAuth = getAuth().currentUser
    signOut(getAuth())
    .then( () => {
        if (actualAuth != null) {
            console.log('Usuario deslogueado')
        }
    })
    .catch( (err) => {
        console.log(err)
    })
})

onAuthStateChanged(auth, (user) => {
    if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/firebase.User
    runApp()
    }
    else {
      console.log('No user ON')
  }
});


//-------------------APP----------------------
    let index = 0
    
    let ok_button = document.getElementById('ok')
    
    let totalNode = document.getElementById('total')
    
    let toPayNode = document.getElementById('to-pay')
    
    let purchasesNode = document.getElementById('purchases')
    
    let toggleButton = document.getElementById('show-button')
    
    let table = document.getElementsByTagName('table')[0]


async function saveToDB(object, collect, idToSave) {
    try {
        // const docRef = await addDoc(collection(db, collect), object);
        await setDoc(doc(db, collect, idToSave.toString()), object);
        console.log("Document written with ID: ", idToSave);
        idToSave++
      } catch (e) {
        console.error("Error adding document: ", e);
      }
}

async function deleteFromDB(id, collect) {
    try {
        await deleteDoc(doc(db, collect, id));
        console.log('Deleted')
    }
    catch(err) {
        console.log(err)
    }
}

function getFromDB() {
    return getDocs(collection(db, "purchases"));
}

async function runApp() {
    // let purchases = (await getFromDB()).docs.map( (elem) => elem.data())

    let idToSave = (await getDocs(collection(db, "productIndex"))).docs.length == 0 ? 0 : parseInt((await getDocs(collection(db, "productIndex"))).docs[0].data().index)

    let purchases = [];

    async function getPurchasesArray() {
        (await getFromDB()).forEach((doc) => {
            let element = doc.data()
            element.id = doc.id
            purchases.push(element)
        });
    }
    
    await getPurchasesArray()
    updateTotal()
    updateToPay()
    purchases.forEach(element => {
        updateTable(element.name, element.product, element.price, element.date)        
    });    

    function updateTable(name, product, price, formatedDate) {
        let tr = document.createElement('tr')
        tr.dataset.purchaseIndex = index;
        index++
        const dateTd = document.createElement("td");
        dateTd.innerHTML = formatedDate;
        tr.appendChild(dateTd)
        const personTd = document.createElement("td");
        personTd.innerHTML = name.toUpperCase()+" -";
        tr.appendChild(personTd)
        const prodTd = document.createElement("td");
        prodTd.innerHTML = product+" -";
        tr.appendChild(prodTd)
        const priceTd = document.createElement("td");
        priceTd.innerHTML = "$"+price;
        tr.appendChild(priceTd)
        const buttonsTd = document.createElement("td");
        tr.appendChild(buttonsTd)
        const removePurchaseButton = document.createElement("input")
        removePurchaseButton.type = "button";
        removePurchaseButton.classList.add("del-but");
        removePurchaseButton.value = "X";
        removePurchaseButton.onclick = async function(e) {
            if (confirm("Borrar compra?") == true) {				
                const tr = e.target.parentNode.parentNode;
                const purchaseIndex = tr.dataset.purchaseIndex;
                let toDelete = purchases.splice(purchaseIndex,1)
                tr.parentNode.removeChild(tr)
                index--
                await deleteFromDB(toDelete[0].id, 'purchases')
                purchases = []
                await getPurchasesArray()
                updateTotal()
                updateToPay()
            }
        };
        buttonsTd.appendChild(removePurchaseButton)
        table.appendChild(tr)
    
    }
    
    async function addPurchase(name, product, price) {
        let date = new Date()
        let formatedDate = `${date.getDate()}/${date.getMonth()+1}/${parseInt(date.getYear()%100)}`
        await saveToDB({name: name, product: product, price: price, date: formatedDate}, "purchases", idToSave)
        await updateDoc(doc(db, "productIndex", "productIndex"), {index: idToSave+1});
        idToSave = parseInt((await getDocs(collection(db, "productIndex"))).docs[0].data().index)
        purchases = []
        await getPurchasesArray()
        updateTotal()
        updateToPay()
        updateTable(name, product, price, formatedDate)
    }
    
    function updateTotal() {
        let total = (purchases.map( (elem) => elem.price).reduce( (previousValue, currentValue) => previousValue + currentValue, 0))
        totalNode.innerHTML = total
    }
    
    function updateToPay() {
        let gastosNico = purchases.filter( (elem) => elem.name == 'nico').map( (elem) => elem.price).reduce( (previousValue, currentValue) => previousValue + currentValue, 0) 
        let gastosRo = purchases.filter( (elem) => elem.name == 'rocio').map( (elem) => elem.price).reduce( (previousValue, currentValue) => previousValue + currentValue, 0)
        let deudor = gastosNico > gastosRo ? 'Rocio' : 'Nico'
        let toPay = (gastosNico < gastosRo) ? (gastosNico+gastosRo) / 2 - gastosNico : (gastosNico+gastosRo) / 2 - gastosRo;
        toPayNode.innerHTML = deudor + ' debe ' + parseInt(toPay)
        
    }
    
    function togglePurchases() {
        if (purchasesNode.style.display == 'block') {
            purchasesNode.style.display = 'none'
        }
        else {
            purchasesNode.style.display = 'block'
        }
    }
    
    ok_button.addEventListener('click', (e) => {
        e.preventDefault()
    }) 
    
    ok_button.addEventListener('click', (e) => {
            let name = e.target.parentElement.children[0].value
            let product = e.target.parentElement.children[1].value
            let price = parseInt(e.target.parentElement.children[2].value)
            if ( (name === 'nico' || name === 'rocio') && !isNaN(price) && product !== "") {
            addPurchase(name, product, price)
            e.target.parentElement.children[1].value = ""
            e.target.parentElement.children[2].value = ""
            e.target.parentElement.children[0].options.item(0).selected = 'selected';    
        }
    })
    
    toggleButton.addEventListener('click', (e) => {
        togglePurchases()
    })
}