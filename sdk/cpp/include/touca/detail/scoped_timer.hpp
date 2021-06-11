// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "touca/lib_api.hpp"
#include <string>

namespace touca {

    /**
     * @brief a simple class that helps clients log the duration between
     *        its instantiation and destruction as a performance metric.
     *
     * @see touca::make_timer
     */
    class TOUCA_CLIENT_API scoped_timer {
    public:
        /**
         *
         */
        explicit scoped_timer(const std::string& name);

        /**
         *
         */
        ~scoped_timer();

    private:
        std::string _name;
    };

} // namespace touca