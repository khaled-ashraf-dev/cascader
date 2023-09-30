const {
    ipcRenderer
} = require('electron');
const {
    spawn
} = require('child_process');
const path = require('path');


const { remote } = require('electron');

const EventEmitter = require('events');
const config = require('./config.json');
const clients = config.clients;
const htmlEl = document.getElementById("html");
htmlEl.style.fontSize = `${config.font_size}px`;

let acctsJson = {};
let hwnds = [];


document.addEventListener('keydown', event => {
  if (event.key === 's') {
    const placeholderButtons = document.querySelectorAll('.stack-placeholder')
	placeholderButtons.forEach(button => {
		button.classList.toggle('hide')
	}
	)
	
  }
});

function initialize() {
    const emitter = new EventEmitter();
	const clientContainer = document.getElementById('client-container');

	for (const client in config.clients) {
	  const button = document.createElement('button');
	  button.className = 'client-btn';
	  button.textContent = client;
	  button.setAttribute("name", client)
	  clientContainer.appendChild(button);
	}
	
  const scriptPath = path.join(__dirname, 'python_scripts', 'get_accounts.py');
  const pyGetAccts = spawn('python', [scriptPath, config.accounts_file]);
  
    pyGetAccts.stdout.on('data', (data) => {
        const jsonData = JSON.parse(data.toString());

        let idx = 0;
        for (const item of jsonData) {
            acctsJson[idx] = {
                "name": item,
                "hwnd": -1,
                "foreground": false,
                "order": idx
            };
            idx++;
        }

        const btnDiv = document.getElementById('stack-1');
        for (const key in acctsJson) {
            const button = document.createElement('button');
			
            button.textContent = acctsJson[key].name;
            button.classList.add('inactive');
            button.classList.add('draggable');
            button.setAttribute("name", acctsJson[key].name)
			button.setAttribute("hwnd", -1)
			button.setAttribute("id", acctsJson[key].name)
            button.addEventListener('click', () => {
                processBtnClick(button);
            })
			button.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  processBtnRightClick(button);
});

            btnDiv.appendChild(button);
        }
		






        emitter.emit('done');
    });

    return emitter;
}

function updateHWNDS() {
    var buttons = document.querySelectorAll("#main-buttons button");
	hwnds = [];
    for (var i = 0; i < buttons.length; i++) {
		if (!buttons[i].classList.contains('stack-placeholder')) {
		var hwnd = buttons[i].getAttribute("hwnd");
		hwnds.push(hwnd);}
	}
	console.log(hwnds)
}

function cascade(button = null) {
  const stacks = ["#stack-1 button", "#stack-2 button", "#stack-3 button", "#stack-4 button"];
  const hwnds = [];
  const stackData = [];

  for (let j = 0; j < 4; j++) {
    const stack = config.stacks[`stack${j+1}`];
    stackData.push([stack.startx, stack.starty, stack.offsetx, stack.offsety]);
    const buttons = document.querySelectorAll(stacks[j]);
	
	let hwnds__ = []
    for (let i = 0; i < buttons.length; i++) {
      const hwnd__ = parseInt(buttons[i].getAttribute("hwnd"));
      if (hwnd__ !== -1 && hwnd__) {
        hwnds__.push(hwnd__);
      }
    }
	hwnds.push(hwnds__)
  }

  if (hwnds.length > 0) {
    const scriptPath = path.join(__dirname, 'python_scripts', 'cascade_ctypes.py');
    const pyCascade = spawn('python', [scriptPath, JSON.stringify(hwnds), JSON.stringify(stackData)]);
    console.log(hwnds)
	console.log(stackData)

    pyCascade.stderr.on('data', (data) => {
      console.error(`Python error: ${data}`);
    });
	
	pyCascade.stdout.on('data', (data) => {
		let x = data.toString('utf-8')
		console.log(`python: ${x}`)
	})
	
    pyCascade.on('close', (code) => {
      if (button) {
        bringToForeground(button);
      }
    });
  }
}



function runPythonScript(hwnds_, btn, clientName) {
    return new Promise((resolve, reject) => {
		const name = btn.getAttribute('name')
    const scriptPath = path.join(__dirname, 'python_scripts', 'launch_ctypes.py');
    const pyLaunchAcct = spawn('python', [scriptPath, JSON.stringify(hwnds), name, clients[clientName], JSON.stringify(config.keywords)]);

        pyLaunchAcct.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Python script failed with exit code ${code}`));
            } else {
                resolve();
            }
        });

        pyLaunchAcct.stdout.on('data', (data) => {
            const hwnd = parseInt(data.toString('utf-8'));
            btn.setAttribute('hwnd', hwnd)
            updateHWNDS();
            cascade();

        });

        pyLaunchAcct.stderr.on('data', (data) => {
            console.error(data.toString('utf-8'));
        });
    });
}


const emitter = initialize();

emitter.on('done', () => {
  setInterval(checkCrash, 200);

  const buttons = document.querySelectorAll('.draggable');

  buttons.forEach(button => {
    button.addEventListener('dragstart', handleDragStart);
    button.addEventListener('drop', handleDrop);
    button.addEventListener('dragover', handleDragOver);
    button.addEventListener('dragleave', handleDragLeave);
  });

  let dragSrcElement = null;

  function handleDragStart(event) {
    dragSrcElement = this;
    this.classList.add('dragging');
    event.dataTransfer.setData('text/plain', this.getAttribute('id'));
  }

  function handleDrop(event) {
    event.preventDefault();
    const dragId = event.dataTransfer.getData('text/plain');
    const dragElement = document.querySelector(`[id='${dragId}']`);
    const dropElement = this;
    dropElement.insertAdjacentElement('afterend', dragElement);
    dragSrcElement.classList.remove('dragging');
    onButtonOrderChanged();
  }

  function handleDragOver(event) {
    event.preventDefault();
    this.classList.add('drop-target');
  }

  function handleDragLeave(event) {
    this.classList.remove('drop-target');
  }

  function onButtonOrderChanged() {
    cascade();
  }

  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    button.draggable = true;
    button.addEventListener('dragstart', handleDragStart);
    button.addEventListener('dragover', handleDragOver);
    button.addEventListener('dragleave', handleDragLeave);
    button.addEventListener('drop', handleDrop);
  }

  // Add dragend event listener to the document
  document.addEventListener('dragend', event => {
    const buttons = document.querySelectorAll('.draggable');
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      if (button.classList.contains('drop-target')) {
        button.classList.remove('drop-target');
      }
	  if (button.classList.contains('dragging')) {
		  button.classList.remove('dragging');
	  }
    }
  });
});

function bringToForeground(btn) {
	
	handle = parseInt(btn.getAttribute('hwnd'))
	const scriptPath = path.join(__dirname, 'python_scripts', 'to_foreground.py');
  const pyForeground = spawn('python', [scriptPath, handle]);
	pyForeground.stderr.on('data', (data) => {
      console.error(data.toString('utf-8'));
    });
	pyForeground.on('exit', () => {
        
    });

}

function processClient(btnEl, n) {
  var buttons = btnEl.parentNode.querySelectorAll("button:not(.inactive)");
  var order = 0;
  for (var i = 0; i < buttons.length; i++) {
    if (buttons[i] === btnEl) {
      break;
    }
    order++;
  }

  btnEl.classList.toggle('inactive')
  runPythonScript(hwnds, btnEl, n);

  var inactiveButtons = document.querySelectorAll(".inactive");
  for (var i = 0; i < inactiveButtons.length; i++) {
    inactiveButtons[i].disabled = true;
  }

  // Enable all buttons after 15 seconds
  setTimeout(function() {
    for (var i = 0; i < inactiveButtons.length; i++) {
      inactiveButtons[i].disabled = false;
    }
  }, parseInt(config.wait) * 1000 );

  var modal = document.getElementById("myModal");
  modal.style.display = "none";
}

function processBtnClick(btnEl) {
  var modal = document.getElementById("myModal");
  var btn = btnEl;

  if (btn.classList.contains("inactive")) {
    modal.style.display = "flex";

    // JavaScript code to close the modal when clicking outside of it
    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }

    const clientContainer = document.getElementById('client-container');
    const clientButtons = clientContainer.getElementsByClassName('client-btn');

    for (let i = 0; i < clientButtons.length; i++) {
      const clientButton = clientButtons[i];
      const clientName = clientButton.getAttribute("name"); // Extract the client ID from the button ID

      clientButton.onclick = function () {
        processClient(btnEl, clientName);
      }
    }

  } else {
  
    if (btnEl.classList.contains('foreground')) { // Add the missing closing parenthesis here
      cascade();
	  clearForeground();
	  
    } else {
      const anyForeground = checkForeground();
	  if (anyForeground) {
		clearForeground();
		btnEl.classList.add('foreground');  
		cascade(btnEl)
	  } else {
		  bringToForeground(btnEl);
		  btnEl.classList.add('foreground');  
	  }
	  
      
    }
  }
}

function checkForeground() {
  var buttons = document.querySelectorAll("#main-buttons button");
  
  for (var i = 0; i < buttons.length; i++) {
    if (buttons[i].classList.contains('foreground')) {
      return true
    }
  }
}

function clearForeground() {
	var buttons = document.querySelectorAll("#main-buttons button");
  
  for (var i = 0; i < buttons.length; i++) {
    if (buttons[i].classList.contains('foreground')) {
      buttons[i].classList.remove('foreground')
    }
  }
}

function killWindow(btn) {
	hwnd = btn.getAttribute('hwnd')
	const scriptPath = path.join(__dirname, 'python_scripts', 'kill_window.py');
  const pyKillWindow = spawn('python', [scriptPath, hwnd]);
	btn.classList.toggle('inactive');
	btn.setAttribute('hwnd', -1);
	updateHWNDS();
	cascade();
}

function processBtnRightClick(button) {
  if (!button.classList.contains('inactive')) {
  const confirmed = confirm('Are you sure you want to do this?');
  if (confirmed) {
    killWindow(button)
  }
}}


function checkCrash() {
  const hasNonNegativeOne = hwnds.some(element => element !== -1);
  if (hasNonNegativeOne) {
    const scriptPath = path.join(__dirname, 'python_scripts', 'check_crash.py');
    const pyCheckCrash = spawn('python', [scriptPath, ...hwnds]);
    pyCheckCrash.stdout.on('data', (data) => {
      const hwnd_ = parseInt(data.toString('utf-8'));
      const buttons = document.querySelectorAll("#main-buttons button");
      for (let i = 0; i < buttons.length; i++) {
        const hwnd = parseInt(buttons[i].getAttribute("hwnd"));
        if (hwnd === hwnd_) {
          buttons[i].setAttribute('hwnd', -1);
          buttons[i].classList.toggle('inactive');
          updateHWNDS();
          cascade();
        }
      }
    });
    pyCheckCrash.stderr.on('data', (data) => {
      console.error(data.toString('utf-8'));
    });
  }
}

function closeAll() {
  const buttons = document.querySelectorAll("#main-buttons button");
      for (let i = 0; i < buttons.length; i++) {
	  if (!buttons[i].classList.contains('inactive')) {
		  killWindow(buttons[i])}
	  }	
}





const stacks = document.querySelectorAll('.stack');

stacks.forEach((parent) => {
  // Create a new observer for each parent element
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && parent.childElementCount > 1) {
        parent.classList.add('contains-accounts');
		console.log('hey')
      } else {
		  
	  }
    });
  });

  // Configure the observer to listen for changes to child nodes
  const stackConfig = { childList: true };

  // Start observing the parent element
  observer.observe(parent, stackConfig);
});