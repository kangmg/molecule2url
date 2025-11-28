# molecule2url
**Share your molecules simply via URL.**

<table align="center">
  <tr>
    <td align="center" width="50%">
      <img src="asset/main.png" width="100%" />
      <br />
      <b>Main Viewer</b>
    </td>
    <td align="center" width="50%">
      <img src="asset/list.png" width="100%" />
      <br />
      <b>Molecule List</b>
    </td>
  </tr>
</table>


## Usage

### 1. Deployment (How to host your own)
You can easily host your own instance of this viewer using GitHub Pages.

<ol>
  <li>
    <b>Fork the Repository</b>
    <br/>
    Start by forking <code>github.com/kangmg/molecule2url</code> to your own GitHub account.
    <div align="center">
      <img src="asset/1.png" width="60%" style="margin-top: 10px; border-radius: 8px; border: 1px solid #ddd;" />
    </div>
  </li>
  <br/>
  <li>
    <b>Configure Deployment Source</b>
    <br/>
    Navigate to <i>Settings > Pages > Build and deployment</i> and change the <b>Source</b> to <b>GitHub Actions</b>.
    <div align="center">
      <img src="asset/2.png" width="60%" style="margin-top: 10px; border-radius: 8px; border: 1px solid #ddd;" />
    </div>
  </li>
  <br/>
  <li>
    <b>Enable Workflows</b>
    <br/>
    Go to the <b>Actions</b> tab. Click the green button labeled "<b>I understand my workflows, go ahead and enable them</b>".
    <div align="center">
      <img src="asset/3.png" width="60%" style="margin-top: 10px; border-radius: 8px; border: 1px solid #ddd;" />
    </div>
  </li>
  <br/>
  <li>
    <b>Trigger Deployment</b>
    <br/>
    The site deploys automatically on every push. To start, upload or remove the xyz files in <code>/molecules/*.xyz</code>.
    <div align="center">
      <img src="asset/4.png" width="60%" style="margin-top: 10px; border-radius: 8px; border: 1px solid #ddd;" />
    </div>
  </li>
  <br/>
  <li>
    <b>Display Deployment URL</b>
    <br/>
    Mark the checkbox. This makes your live URL visible on the repository homepage.
    <div align="center">
      <img src="asset/5.png" width="60%" style="margin-top: 10px; border-radius: 8px; border: 1px solid #ddd;" />
    </div>
  </li>
  <br/>
  <li>
    <b>Done!</b>
    <br/>
    Your personal molecule viewer is now live and ready to share. 
    <br/>
    (<code>https://&lt;your-username&gt;.github.io/molecule2url/</code>)
  </li>
</ol>

### 2. Adding Molecules
Upload your `.xyz` files (single or multi-frame) into the `molecules` folder.


> The **comment line** (2nd line of the file) will be automatically used as the description.
