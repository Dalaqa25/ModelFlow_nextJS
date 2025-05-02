export default function Home() {
  return (
      <main className='flex items-center justify-center w-full h-full'>
          <section className='flex justify-between w-[85%]'>
              <div className='flex flex-col justify-center gap-7'>
                  <div style={{background:'rgba(63,77,223,0.75)', color:'#fff'}} className='py-1.5 px-8 text-sm rounded-2xl w-[30%] text-center'>HOME</div>
                  <h1 className='text-7xl font-semibold'>
                      Crate Your <br/>
                      Custom <br/>
                      Workspace.
                  </h1>
                  <p className='text-gray-400 text-[18px]'>For developers and businesses</p>
                  <button style={{background:'#6472ef'}} className='py-4 text-white text-sm w-[170px] rounded-2xl'>Get Started</button>
              </div>

              <img src='/main.png' alt='main' className='w-[45%]'/>
          </section>
      </main>
  );
}
