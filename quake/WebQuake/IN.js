IN = {};

IN.mouse_x = 0.0;
IN.mouse_y = 0.0;
IN.old_mouse_x = 0.0;
IN.old_mouse_y = 0.0;
IN.locked = false;

IN.StartupMouse = function()
{
	IN.m_filter = Cvar.RegisterVariable('m_filter', '1');
	if (COM.CheckParm('-nomouse') != null)
		return;
	if (VID.mainwindow.requestPointerLock != null)
	{
		IN.movementX = 'movementX';
		IN.movementY = 'movementY';
		IN.pointerLockElement = 'pointerLockElement';
		IN.requestPointerLock = 'requestPointerLock';
		IN.pointerlockchange = 'onpointerlockchange';
	}
	else if (VID.mainwindow.webkitRequestPointerLock != null)
	{
		IN.movementX = 'webkitMovementX';
		IN.movementY = 'webkitMovementY';
		IN.pointerLockElement = 'webkitPointerLockElement';
		IN.requestPointerLock = 'webkitRequestPointerLock';
		IN.pointerlockchange = 'onwebkitpointerlockchange';
	}
	else if (VID.mainwindow.mozRequestPointerLock != null)
	{
		IN.movementX = 'mozMovementX';
		IN.movementY = 'mozMovementY';
		IN.pointerLockElement = 'mozPointerLockElement';
		IN.requestPointerLock = 'mozRequestPointerLock';
		IN.pointerlockchange = 'onmozpointerlockchange';
	}
	else
		return;

	// Clic en el canvas = capturar mouse
	VID.mainwindow.onclick = IN.onclick;

	// Movimiento del mouse — funciona siempre que esté capturado
	document.addEventListener('mousemove', IN.onmousemove);

	// Cambio de estado del pointer lock
	document[IN.pointerlockchange] = IN.onpointerlockchange;

	IN.mouse_avail = true;
};

IN.Init = function()
{
	IN.StartupMouse();
};

IN.Shutdown = function()
{
	if (IN.mouse_avail === true)
	{
		VID.mainwindow.onclick = null;
		document.removeEventListener('mousemove', IN.onmousemove);
		document[IN.pointerlockchange] = null;
	}
};

IN.MouseMove = function()
{
	if (IN.mouse_avail !== true)
		return;

	// Solo procesar si el mouse está capturado
	if (!IN.locked)
		return;

	var mouse_x, mouse_y;
	if (IN.m_filter.value !== 0)
	{
		mouse_x = (IN.mouse_x + IN.old_mouse_x) * 0.5;
		mouse_y = (IN.mouse_y + IN.old_mouse_y) * 0.5;
	}
	else
	{
		mouse_x = IN.mouse_x;
		mouse_y = IN.mouse_y;
	}
	IN.old_mouse_x = IN.mouse_x;
	IN.old_mouse_y = IN.mouse_y;
	mouse_x *= CL.sensitivity.value;
	mouse_y *= CL.sensitivity.value;

	var strafe = CL.kbuttons[CL.kbutton.strafe].state & 1;
	var angles = CL.state.viewangles;

	// Movimiento horizontal — siempre activo con el mouse
	if (strafe !== 0)
		CL.state.cmd.sidemove += CL.m_side.value * mouse_x;
	else
		angles[1] -= CL.m_yaw.value * mouse_x;

	// Movimiento vertical — siempre activo (freelook completo)
	V.StopPitchDrift();
	angles[0] += CL.m_pitch.value * mouse_y;
	if (angles[0] > 80.0)
		angles[0] = 80.0;
	else if (angles[0] < -70.0)
		angles[0] = -70.0;

	IN.mouse_x = IN.mouse_y = 0;
};

IN.Move = function()
{
	IN.MouseMove();
};

// Un solo clic captura el mouse — no hace falta mantenerlo
IN.onclick = function()
{
	if (document[IN.pointerLockElement] !== VID.mainwindow)
	{
		VID.mainwindow[IN.requestPointerLock]();
	}
};

IN.onmousemove = function(e)
{
	if (document[IN.pointerLockElement] !== VID.mainwindow)
		return;
	IN.mouse_x += e[IN.movementX];
	IN.mouse_y += e[IN.movementY];
};

// Cuando se suelta el pointer lock (ESC) — NO mandar ESC al juego
// para que no abra el menú automáticamente
IN.onpointerlockchange = function()
{
	if (document[IN.pointerLockElement] === VID.mainwindow)
	{
		// Mouse capturado
		IN.locked = true;
	}
	else
	{
		// Mouse suelto — solo marcamos como no capturado
		// sin mandar ESC para no interrumpir el juego
		IN.locked = false;
	}
};
