/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "boost/filesystem/path.hpp"
#include "boost/program_options.hpp"
#include "service.hpp"
#include "weasel/devkit/extra/logger.hpp"
#include "weasel/devkit/options.hpp"
#include <fstream>
#include <iostream>

#define pov boost::program_options::value<std::string>

/**
 *
 *
 * @param argc number of arguments provided to the application
 * @param argv list of arguments provided to the application
 * @param options container to hold application configuration parameters
 * @return zero if all command line arguments were parsed successfully
 *         positive if application should exit immediately with success
 *         negative if application should exit immediately with failure
 */
int find_application_options(int argc, char* argv[], ConfigOptions& options)
{
    namespace po = boost::program_options;
    // clang-format off
    po::options_description opts_cmd{ "Command Line Options" };
    opts_cmd.add_options()
        ("help,h", "displays this help message")
        ("config-file,c", pov()->required(), "path to configuration file");
    // clang-format on

    // parse configuration parameters provided via command line
    po::variables_map vm;
    try
    {
        po::store(po::parse_command_line(argc, argv, opts_cmd), vm);
        po::notify(vm);
    }
    catch (const std::exception& ex)
    {
        std::cerr << ex.what() << '\n'
                  << opts_cmd << std::endl;
        return -1;
    }

    // if user gives --help argument, print help message and exit
    if (vm.count("help"))
    {
        std::cout << opts_cmd << std::endl;
        return 1;
    }

    // parse configuration parameters provided via config file
    po::options_description opts_file = options.description();
    try
    {
        std::ifstream ifs { vm["config-file"].as<std::string>().c_str() };
        if (ifs)
        {
            po::store(po::parse_config_file(ifs, opts_file, true), vm);
        }
    }
    catch (const po::error& ex)
    {
        std::cerr << ex.what() << '\n'
                  << opts_file << std::endl;
        return -1;
    }

    // populate config options manager
    for (const auto& value : vm)
    {
        if (!options.data.hasName(value.first))
        {
            continue;
        }
        const auto& key = options.data.toKey(value.first);
        options.data.add(key, value.second.as<std::string>());
    }

    return 0;
}

/**
 *
 *
 * @param argc
 * @param argv
 */
int main(int argc, char* argv[])
{
    using co = ConfigOptions::Value;
    ConfigOptions options;
    auto& opts = options.data;

    // update options based on given command lines
    // the function handles cases where user has used options such as
    // --help or has provided invalid options in which case
    // non-zero value is returned as a signal to end program execution.
    const auto ret = find_application_options(argc, argv, options);
    if (ret)
    {
        return ret;
    }

    // initialize logger
    if (opts.has(co::log_dir) && opts.has(co::log_level))
    {
        using weasel::internal::Logger;

        boost::filesystem::path logDir { opts.get(co::project_dir) };
        logDir /= opts.get(co::log_dir);

        const auto level = Logger::level_values.at(opts.get(co::log_level));

        auto& logger = weasel::internal::Logger::instance();
        logger.add_file_handler(logDir.string(), level);
        logger.set_console_handler(level);
        WEASEL_LOG_INFO("Hello from Weasel Comparator");
    }

    // initialize the comparator in service mode
    Service service { options };

    // validate configuration options
    if (!service.validate())
    {
        std::cerr << "failed to validate provided options" << '\n'
                  << options.description() << std::endl;
        return EXIT_FAILURE;
    }

    // initialize comparator in service mode
    if (!service.init())
    {
        std::cerr << "failed to initialize operation" << '\n'
                  << options.description() << std::endl;
        return EXIT_FAILURE;
    }

    // start running the comparator.
    // note that the comparator runs as a service, periodically running
    // a task every few seconds. hence, we don't expect that the function
    // returns unless an interrupt signal hints that it has to stop.
    if (service.run())
    {
        std::cerr << "successfully performed the required operation"
                  << std::endl;
        return EXIT_SUCCESS;
    }

    std::cerr << "failed to run requested operation" << std::endl;
    return EXIT_FAILURE;
}
