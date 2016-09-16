<style>
.mbutton {
	background-color: green;
	color: white;
	border-radius: 3px;
	font-size: 12px;
	width: 25px;
}
</style>

<template id="layout-materials-pane">
	<table id="materials-root">
		<thead><tr> Material Presets</tr></thead>
			<tr>
				<td>Material Name</td>
				<td><table>
					<tr>
						<td>cuts</td>
						<td>speed</td>
						<td>power</td>
					</tr>
				</table>
			</tr>
		<tbody data-bind="foreach: materialList">
			<tr>
				<td><input data-bind="text: name"></td>
				<td><table>
					<tbody class=".mtable" data-bind="foreach: materialSettings">
					<tr>
						<td><input class=".mtable" data-bind="text: name"></td>
                                                <td><input class=".mtable" data-bind="text: speed"></td>
                                                <td><input class=".mtable" data-bind="text: power"></td>
                                                <td><button class="mbutton" data-bind="click: $parent.removeLaserSetting">-</button></tr>
					</tr>
					<tr><button class="mbutton" data-bind="click: addLaserSetting">+</button></tr>
				</table></td>
			</tr>
			<tr><button data-bind="click: addMaterial" class="mbutton">+</button></tr>
		</tbody>
	</table>
</template>
