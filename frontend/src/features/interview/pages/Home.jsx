import React from 'react'
import '../style/home.scss'

const Home = () => {
    return (
        <main className='home'>
            <div className="interview-input-group">
                <div className='left'>
                    <label htmlFor="jobdescription">Job Description</label>
                    <textarea name="jobdescription" id="jobdescription" placeholder='Enter job description here...'></textarea>
                </div>
                <div className="right">
                    <div className="input-group">
                        <p>Resume <small className='highlight'>(Use Resume and Self Description together for better result)</small></p>
                        <label className='file-label' htmlFor="resume">Upload resume</label>
                        <input hidden type="file" id="resume" name='resume' accept=".pdf" />
                    </div>
                    <div className="input-group">
                        <label htmlFor="selfdescription">Self Description</label>
                        <textarea name="selfdescription" id="selfdescription" placeholder='Enter your self description here...'></textarea>
                    </div>
                    <button className='button primary-button'>Generate Interview Report</button>
                </div>
            </div>
        </main>
    )
}

export default Home